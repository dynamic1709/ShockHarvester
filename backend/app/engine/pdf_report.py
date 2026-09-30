"""
PDF Harvest Report Generator using ReportLab.
Generates institutional, SEBI-compliant Tax-Loss Harvesting & Defensive Rebalance Statements.
"""
from datetime import datetime, timezone
import io
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)


def generate_harvest_pdf(
    client_name: str,
    client_email: str,
    run_date: str,
    scenario_name: str,
    portfolio_value: float,
    tax_saved_inr: float,
    losses_harvested_inr: float,
    trades: list[dict[str, Any]],
    lot_sales: list[dict[str, Any]],
    commentary_text: str,
) -> bytes:
    """Generate a high-quality PDF report and return raw bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    
    # Custom Brand Palette
    PRIMARY_NAVY = colors.HexColor("#0B132B")
    ACCENT_CYAN = colors.HexColor("#00E5FF")
    ACCENT_EMERALD = colors.HexColor("#10B981")
    TEXT_DARK = colors.HexColor("#1E293B")
    TEXT_MUTED = colors.HexColor("#64748B")
    BG_LIGHT = colors.HexColor("#F8FAFC")
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=PRIMARY_NAVY,
        fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=TEXT_MUTED,
        fontName="Helvetica",
    )
    section_title_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontSize=12,
        leading=16,
        textColor=PRIMARY_NAVY,
        fontName="Helvetica-Bold",
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        fontName="Helvetica",
    )
    commentary_style = ParagraphStyle(
        "Commentary",
        parent=styles["Normal"],
        fontSize=8.5,
        leading=12.5,
        textColor=TEXT_DARK,
        fontName="Helvetica-Oblique",
    )
    th_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.white,
        fontName="Helvetica-Bold",
        alignment=1,
    )
    td_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=TEXT_DARK,
        fontName="Helvetica",
        alignment=0,
    )

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>SHOCKHARVESTER</b>", title_style),
            Paragraph(f"<b>TAX HARVEST STATEMENT</b><br/>FY 2024–25 (AY 2025–26)<br/>Generated: {run_date}", subtitle_style),
        ]
    ]
    header_table = Table(header_data, colWidths=[3.5 * inch, 3.5 * inch])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_NAVY, spaceBefore=4, spaceAfter=12))

    # 2. Client & Summary Grid
    client_info_data = [
        [
            Paragraph(f"<b>Client:</b> {client_name}<br/><b>Account:</b> {client_email}<br/><b>Trigger Event:</b> {scenario_name}", body_style),
            Paragraph(f"<b>Portfolio AUM:</b> ₹{portfolio_value:,.2f}<br/><b>Est. Tax Alpha Saved:</b> <font color='#10B981'><b>₹{tax_saved_inr:,.2f}</b></font><br/><b>Losses Harvested:</b> ₹{losses_harvested_inr:,.2f}", body_style),
        ]
    ]
    client_table = Table(client_info_data, colWidths=[3.5 * inch, 3.5 * inch])
    client_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
        ("BOX", (0, 0), (-1, -1), 1, BORDER_COLOR),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(client_table)
    story.append(Spacer(1, 10))

    # 3. AI Strategy & Portfolio Commentary
    story.append(Paragraph("Portfolio Defense & Tax Strategy Commentary", section_title_style))
    comm_data = [[Paragraph(commentary_text.replace("\n", "<br/>"), commentary_style)]]
    comm_table = Table(comm_data, colWidths=[7.0 * inch])
    comm_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F0FDF4")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#BBF7D0")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(comm_table)
    story.append(Spacer(1, 12))

    # 4. Executed Rebalance Trades Table
    story.append(Paragraph(f"Executed Trades Breakdown ({len(trades)} Orders)", section_title_style))
    trade_rows = [
        [
            Paragraph("Symbol", th_style),
            Paragraph("Side", th_style),
            Paragraph("Qty", th_style),
            Paragraph("Price (₹)", th_style),
            Paragraph("Amount (₹)", th_style),
        ]
    ]
    for t in trades[:15]:  # limit to top 15 in summary statement
        side_color = "#10B981" if t.get("side", "").upper() == "BUY" else "#EF4444"
        trade_rows.append([
            Paragraph(t.get("symbol", "N/A"), td_style),
            Paragraph(f"<font color='{side_color}'><b>{t.get('side', '').upper()}</b></font>", td_style),
            Paragraph(str(t.get("qty", 0)), td_style),
            Paragraph(f"{t.get('price', 0.0):,.2f}", td_style),
            Paragraph(f"{t.get('amount', 0.0):,.2f}", td_style),
        ])
    
    trade_table = Table(trade_rows, colWidths=[1.8 * inch, 1.0 * inch, 1.0 * inch, 1.4 * inch, 1.8 * inch])
    trade_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_NAVY),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
    ]))
    story.append(trade_table)
    story.append(Spacer(1, 12))

    # 5. FIFO Matched Lots Sold Table
    if lot_sales:
        story.append(Paragraph(f"FIFO Matched Tax Lots Harvested", section_title_style))
        lot_rows = [
            [
                Paragraph("Lot Term", th_style),
                Paragraph("Qty Sold", th_style),
                Paragraph("Cost Basis (₹)", th_style),
                Paragraph("Proceeds (₹)", th_style),
                Paragraph("Realized Loss (₹)", th_style),
            ]
        ]
        for s in lot_sales[:10]:
            lot_rows.append([
                Paragraph(s.get("term", "STCG"), td_style),
                Paragraph(str(s.get("qty_sold", 0)), td_style),
                Paragraph(f"{s.get('cost_basis', 0.0):,.2f}", td_style),
                Paragraph(f"{s.get('proceeds', 0.0):,.2f}", td_style),
                Paragraph(f"<font color='#EF4444'>{s.get('gain_loss', 0.0):,.2f}</font>", td_style),
            ])
        
        lot_table = Table(lot_rows, colWidths=[1.2 * inch, 1.1 * inch, 1.5 * inch, 1.5 * inch, 1.7 * inch])
        lot_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_NAVY),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
            ("PADDING", (0, 0), (-1, -1), 4),
            ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ]))
        story.append(lot_table)
        story.append(Spacer(1, 14))

    # 6. Legal & SEBI Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=8, spaceAfter=8))
    disclaimer_text = (
        "<b>Regulatory & Tax Disclaimer:</b> ShockHarvester is a simulated algorithmic portfolio risk and tax optimization tool. "
        "Calculations are based on Indian Income Tax Act rules for FY 2024–25 (STCG @ 20%, LTCG @ 12.5% with ₹1.25 Lakh exemption, "
        "FIFO lot matching, and STT @ 0.1%). Please consult your certified Chartered Accountant (CA) or SEBI-registered tax advisor "
        "for filing your official ITR-2 / ITR-3."
    )
    story.append(Paragraph(disclaimer_text, subtitle_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
