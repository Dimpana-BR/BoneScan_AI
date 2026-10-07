import cv2
import numpy as np
import torch
import torch.nn.functional as F

class GradCAM:
    def __init__(self, model, target_layer=None):
        self.model = model
        if target_layer is not None:
            self.target_layer = target_layer
        else:
            self.target_layer = model.layer4[-1].conv3
            
        self.gradients = None
        self.activations = None
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output

        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0]

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate(self, input_tensor, class_idx=None):
        self.model.eval()
        self.model.zero_grad()

        output = self.model(input_tensor)
        if class_idx is None:
            class_idx = torch.argmax(output, dim=1).item()

        score = output[0, class_idx]
        score.backward(retain_graph=True)

        gradients = self.gradients.detach()
        activations = self.activations.detach()

        weights = torch.mean(F.relu(gradients), dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * activations, dim=1).squeeze(0)

        cam = F.relu(cam).cpu().numpy()
        cam = cv2.resize(cam, (224, 224))

        if np.max(cam) != np.min(cam):
            cam = (cam - np.min(cam)) / (np.max(cam) - np.min(cam))
        else:
            cam = np.zeros_like(cam)

        return cam

def overlay_heatmap(original_img_bgr, cam_mask, alpha=0.50):
    h, w = original_img_bgr.shape[:2]
    cam_resized = cv2.resize(cam_mask, (w, h))

    # 1. Blank out periphery borders where DICOM text & stamps reside
    cam_resized[:int(h * 0.12), :] = 0.0
    cam_resized[int(h * 0.86):, :] = 0.0
    cam_resized[:, :int(w * 0.12)] = 0.0
    cam_resized[:, int(w * 0.88):] = 0.0

    # 2. Strict Tissue Segmentation (Eliminate pure black radiographic air)
    gray = cv2.cvtColor(original_img_bgr, cv2.COLOR_BGR2GRAY)
    _, tissue_mask = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)
    tissue_mask_norm = (tissue_mask > 0).astype(np.float32)
    cam_resized = cam_resized * tissue_mask_norm

    # 3. Peak-Relative Thresholding (Eliminates low-level ambient blue noise)
    # Only activations > 40% of the true maximum lesion heat are preserved
    max_val = np.max(cam_resized)
    if max_val > 0:
        cam_resized[cam_resized < 0.40 * max_val] = 0.0
        cam_resized = (cam_resized - (0.40 * max_val)) / (max_val - (0.40 * max_val) + 1e-7)
        cam_resized = np.clip(cam_resized, 0.0, 1.0)

    # 4. Smooth anatomical blend
    cam_smoothed = cv2.GaussianBlur(cam_resized, (35, 35), 0)
    if np.max(cam_smoothed) > 0:
        cam_smoothed = cam_smoothed / np.max(cam_smoothed)

    # 5. Apply colormap strictly over the focal tumor lesion
    heatmap = cv2.applyColorMap(np.uint8(255 * cam_smoothed), cv2.COLORMAP_JET)
    active_mask = (cam_smoothed > 0.08)[:, :, np.newaxis]
    blended = np.where(active_mask, cv2.addWeighted(original_img_bgr, 1 - alpha, heatmap, alpha, 0), original_img_bgr)

    return blended