import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_patient_pdf(patient, biomarkers, xray, prediction, notes, output_pdf_path: str):
    os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1A365D"),
        alignment=1,
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#4A5568"),
        alignment=1,
        spaceAfter=14
    )
    section_heading = ParagraphStyle(
        'SectionHead',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#2B6CB0"),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#2D3748")
    )
    bold_style = ParagraphStyle(
        'BoldDark',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor("#1A202C")
    )

    # Header
    story.append(Paragraph("BONESCAN AI — ONCOLOGICAL REPORT", title_style))
    story.append(Paragraph("Automated Multimodal Bone Cancer Screening & Risk Assessment", subtitle_style))
    story.append(Spacer(1, 6))

    # Patient Demographics
    story.append(Paragraph("1. PATIENT DEMOGRAPHICS", section_heading))
    patient_data = [
        [Paragraph("Patient UID:", bold_style), Paragraph(patient.patient_uid, body_style),
         Paragraph("Date of Exam:", bold_style), Paragraph(datetime.now().strftime("%Y-%m-%d %H:%M"), body_style)],
        [Paragraph("Full Name:", bold_style), Paragraph(patient.name, body_style),
         Paragraph("Age / Gender:", bold_style), Paragraph(f"{patient.age} Yrs / {patient.gender}", body_style)],
        [Paragraph("Blood Group:", bold_style), Paragraph(patient.blood_group, body_style),
         Paragraph("Contact Phone:", bold_style), Paragraph(patient.phone, body_style)],
    ]
    p_table = Table(patient_data, colWidths=[110, 160, 130, 140])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F7FAFC")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(p_table)
    story.append(Spacer(1, 10))

    # Serum Biomarkers
    story.append(Paragraph("2. SERUM BIOMARKERS & SYMPTOMS", section_heading))
    bio_data = [
        [Paragraph("Indicator", bold_style), Paragraph("Reported", bold_style), Paragraph("Reference Range", bold_style), Paragraph("Status", bold_style)],
        [Paragraph("Alkaline Phosphatase (ALP)", body_style), Paragraph(f"{biomarkers.alp} U/L", body_style), Paragraph("44 - 147 U/L", body_style), Paragraph("Elevated" if biomarkers.alp > 147 else "Normal", bold_style)],
        [Paragraph("Osteopontin (OPN)", body_style), Paragraph(f"{biomarkers.opn} ng/mL", body_style), Paragraph("15 - 55 ng/mL", body_style), Paragraph("Elevated" if biomarkers.opn > 55 else "Normal", bold_style)],
        [Paragraph("Vitamin D", body_style), Paragraph(f"{biomarkers.vitamin_d} ng/mL", body_style), Paragraph("30 - 100 ng/mL", body_style), Paragraph("Deficient" if biomarkers.vitamin_d < 30 else "Sufficient", bold_style)],
        [Paragraph("Reported Pain Level", body_style), Paragraph(str(biomarkers.pain_level), body_style), Paragraph("Low", body_style), Paragraph(str(biomarkers.pain_level), bold_style)],
    ]
    b_table = Table(bio_data, colWidths=[170, 110, 150, 110])
    b_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#EDF2F7")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(b_table)
    story.append(Spacer(1, 10))

    # Multimodal AI Diagnostic Results
    story.append(Paragraph("3. MULTIMODAL AI DIAGNOSTIC SYNTHESIS", section_heading))
    risk_hex = "#E53E3E" if prediction.risk_level in ["CRITICAL", "HIGH"] else "#38A169"
    diag_data = [
        [Paragraph("Radiographic CNN Verdict:", bold_style), Paragraph(f"{xray.cnn_prediction.upper()} ({xray.confidence_score}%)", body_style)],
        [Paragraph("Biomarker Risk Evaluation:", bold_style), Paragraph(f"{biomarkers.biomarker_prediction} ({biomarkers.biomarker_risk_score})", body_style)],
        [Paragraph("Combined Multimodal Score:", bold_style), Paragraph(f"{prediction.fused_score}%", bold_style)],
        [Paragraph("Calculated Risk Level:", bold_style), Paragraph(f"<font color='{risk_hex}'><b>{prediction.risk_level}</b></font>", body_style)],
        [Paragraph("Final AI Diagnosis:", bold_style), Paragraph(prediction.final_diagnosis, bold_style)],
        [Paragraph("System Recommendation:", bold_style), Paragraph(prediction.ai_recommendation, body_style)],
    ]
    d_table = Table(diag_data, colWidths=[180, 360])
    d_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F7FAFC")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(d_table)
    story.append(Spacer(1, 10))

    # Imaging and Explainable AI (Grad-CAM)
    story.append(Paragraph("4. RADIOGRAPHIC IMAGING & GRAD-CAM EXPLAINABILITY", section_heading))
    if os.path.exists(xray.image_path):
        img1 = Image(xray.image_path, width=2.4*inch, height=2.4*inch)
        label1 = Paragraph("<center><b>Original Bone Radiograph</b></center>", body_style)
    else:
        img1 = Paragraph("X-ray file missing from server.", body_style)
        label1 = Paragraph("", body_style)

    if xray.gradcam_path and os.path.exists(xray.gradcam_path):
        img2 = Image(xray.gradcam_path, width=2.4*inch, height=2.4*inch)
        label2 = Paragraph("<center><b>Grad-CAM Heatmap Overlay</b></center>", body_style)
    else:
        img2 = Paragraph("<center><i>Grad-CAM localization omitted.<br/>(Triggered only upon malignancy suspicion)</i></center>", subtitle_style)
        label2 = Paragraph("<center><b>Explainability Visualizer</b></center>", body_style)

    images_table = Table([[img1, img2], [label1, label2]], colWidths=[270, 270])
    images_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(KeepTogether([images_table]))
    story.append(Spacer(1, 10))

    # Doctor Review & Sign-off
    story.append(Paragraph("5. ATTENDING PHYSICIAN CLINICAL REVIEW", section_heading))
    doc_notes = notes.clinical_notes if notes else "Pending oncologist review."
    doc_rec = notes.recommendation if notes else "Pending recommendation."
    doc_data = [
        [Paragraph("Doctor Clinical Notes:", bold_style), Paragraph(doc_notes, body_style)],
        [Paragraph("Physician Directive:", bold_style), Paragraph(doc_rec, body_style)],
    ]
    doc_table = Table(doc_data, colWidths=[180, 360])
    doc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F7FAFC")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(KeepTogether([doc_table]))
    story.append(Spacer(1, 14))

    sign_table = Table([
        [Paragraph("<b>Verification:</b> BoneScan AI Multimodal Core", subtitle_style),
         Paragraph("<b>Authorized Oncologist Signature:</b> ____________________", subtitle_style)]
    ], colWidths=[270, 270])
    story.append(sign_table)

    doc.build(story)
    return output_pdf_path