"""
Markdown rendering utilities for decision frameworks.

This module provides functions to render analysis results
and decision frameworks in well-formatted Markdown.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone


def render_decision_framework(results: Dict[str, Any]) -> str:
    """
    Render analysis results as a comprehensive Markdown decision framework.
    
    Args:
        results: Analysis results dictionary containing:
            - mode: Operating mode used
            - symbol: Stock symbol (optional)
            - compression_detected: Boolean
            - compression_percentage: Float
            - analysis: Analysis text
            - recommendations: List of recommendations
            - current_pe: Current P/E ratio (optional)
            - historical_pe: Historical P/E ratio (optional)
    
    Returns:
        Formatted Markdown string with decision framework
    """
    mode = results.get("mode", results.get("mode_used", "unknown"))
    symbol = results.get("symbol", "UNKNOWN")
    
    # Build comprehensive framework
    sections = []
    
    # Header
    sections.append(_render_header(symbol, mode))
    
    # Executive Summary
    sections.append(_render_executive_summary(results))
    
    # Detailed Analysis
    sections.append(_render_detailed_analysis(results))
    
    # Decision Recommendations
    sections.append(_render_recommendations(results))
    
    # Risk Factors
    sections.append(_render_risk_factors(results))
    
    # Next Steps
    sections.append(_render_next_steps(results))
    
    # Mode Information
    sections.append(_render_mode_info(results))
    
    # Footer
    sections.append(_render_footer())
    
    return "\n\n".join(sections)


def _render_header(symbol: str, mode: str) -> str:
    """
    Render decision framework header.
    
    Args:
        symbol: Stock symbol
        mode: Analysis mode used
    
    Returns:
        Markdown formatted header
    """
    # Handle None values
    symbol_str = str(symbol) if symbol is not None else "UNKNOWN"
    mode_str = mode.title() if mode is not None else "Unknown"
    
    return f"""# P/E Compression Analysis Decision Framework

**Symbol**: {symbol_str}  
**Analysis Mode**: {mode_str}  
**Generated**: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")} UTC"""


def _render_executive_summary(results: Dict[str, Any]) -> str:
    """
    Render executive summary with key metrics.
    
    Args:
        results: Analysis results dictionary
    
    Returns:
        Markdown formatted executive summary
    """
    compression_detected = results.get("compression_detected", False)
    compression_pct = results.get("compression_percentage", 0.0)
    current_pe = results.get("current_pe")
    historical_pe = results.get("historical_pe")
    
    # Determine status indicator
    if compression_detected:
        status = "🔴 **COMPRESSION DETECTED**"
        summary = f"Significant P/E compression of **{compression_pct:.1f}%** detected"
    elif compression_pct < -10:
        status = "🟡 **P/E EXPANSION**"
        summary = f"P/E expansion of **{abs(compression_pct):.1f}%** observed"
    else:
        status = "🟢 **STABLE VALUATION**"
        summary = "P/E ratio remains relatively stable"
    
    lines = ["## Executive Summary", "", status, "", summary]
    
    if current_pe is not None:
        lines.append(f"- **Current P/E**: {current_pe:.2f}")
    if historical_pe is not None:
        lines.append(f"- **Historical P/E**: {historical_pe:.2f}")
    if current_pe and historical_pe:
        lines.append(f"- **Change**: {compression_pct:+.1f}%")
    
    return "\n".join(lines)


def _render_detailed_analysis(results: Dict[str, Any]) -> str:
    """
    Render detailed analysis section.
    
    Args:
        results: Analysis results dictionary
    
    Returns:
        Markdown formatted detailed analysis
    """
    analysis_text = results.get("analysis", "No detailed analysis available")
    
    # Format the analysis text with proper Markdown
    lines = ["## Detailed Analysis", ""]
    
    # Split analysis into paragraphs if it's multiline
    for line in analysis_text.split("\n"):
        if line.strip():
            lines.append(line)
    
    # Add industry comparison if available
    industry_avg = results.get("industry_average")
    current_pe = results.get("current_pe")
    
    if industry_avg and current_pe:
        diff_pct = ((current_pe - industry_avg) / industry_avg) * 100
        lines.append("")
        lines.append("### Industry Comparison")
        lines.append(f"- Industry Average: {industry_avg:.2f}")
        lines.append(f"- Difference: {diff_pct:+.1f}%")
        
        if abs(diff_pct) > 20:
            if diff_pct > 0:
                lines.append("- ⚠️  **Premium Valuation** - Trading significantly above industry average")
            else:
                lines.append("- ⚠️  **Discount Valuation** - Trading significantly below industry average")
    
    return "\n".join(lines)


def _render_recommendations(results: Dict[str, Any]) -> str:
    """
    Render actionable decision recommendations.
    
    Args:
        results: Analysis results dictionary
    
    Returns:
        Markdown formatted recommendations
    """
    recommendations = results.get("recommendations", [])
    
    lines = ["## Decision Recommendations", ""]
    
    if recommendations:
        for i, rec in enumerate(recommendations, 1):
            lines.append(f"{i}. {rec}")
    else:
        # Generate default recommendations based on results
        compression_detected = results.get("compression_detected", False)
        
        if compression_detected:
            lines.extend([
                "1. **Investigate Fundamentals**: Determine if compression is justified",
                "2. **Review Recent News**: Check for company-specific events",
                "3. **Assess Growth Prospects**: Verify if reduced multiple reflects reality",
                "4. **Consider Entry Point**: May present buying opportunity if fundamentals strong"
            ])
        else:
            lines.extend([
                "1. **Monitor Trends**: Continue tracking P/E ratio movements",
                "2. **Compare Peers**: Benchmark against similar companies",
                "3. **Review Fundamentals**: Ensure valuation aligns with performance",
                "4. **Set Alerts**: Establish thresholds for significant changes"
            ])
    
    return "\n".join(lines)


def _render_risk_factors(results: Dict[str, Any]) -> str:
    """
    Render risk factors and considerations.
    
    Args:
        results: Analysis results dictionary
    
    Returns:
        Markdown formatted risk factors
    """
    lines = ["## Risk Factors & Considerations", ""]
    
    mode = results.get("mode", results.get("mode_used", "unknown"))
    limitations = results.get("limitations", [])
    
    # Add mode-specific limitations
    if limitations:
        lines.append("**Data Limitations:**")
        for limitation in limitations:
            lines.append(f"- {limitation}")
        lines.append("")
    
    # Add general risk factors
    lines.extend([
        "**General Considerations:**",
        "- P/E ratios are historical metrics and may not reflect future performance",
        "- Market sentiment can override fundamental valuations",
        "- Industry averages may not account for company-specific factors",
        "- Consider other valuation metrics (P/B, P/S, DCF) for complete picture"
    ])
    
    # Add data quality warning for non-Full mode
    if mode != "full":
        lines.append("")
        lines.append("⚠️  **Data Quality Note**: Analysis based on " + 
                    ("cached data" if mode == "offline" else "static data") +
                    " - Consider using Full mode with live data for critical decisions")
    
    return "\n".join(lines)


def _render_next_steps(results: Dict[str, Any]) -> str:
    """
    Render actionable next steps checklist.
    
    Args:
        results: Analysis results dictionary
    
    Returns:
        Markdown formatted next steps
    """
    compression_detected = results.get("compression_detected", False)
    
    lines = ["## Next Steps", ""]
    
    if compression_detected:
        lines.extend([
            "- [ ] Deep dive into recent earnings reports",
            "- [ ] Review analyst estimates and guidance",
            "- [ ] Check insider trading activity",
            "- [ ] Analyze cash flow and balance sheet strength",
            "- [ ] Compare with 3-5 peer companies",
            "- [ ] Determine if compression creates opportunity",
            "- [ ] Set price targets and entry points",
            "- [ ] Document investment thesis"
        ])
    else:
        lines.extend([
            "- [ ] Continue monitoring P/E trends",
            "- [ ] Review quarterly earnings releases",
            "- [ ] Track industry developments",
            "- [ ] Update valuation model quarterly",
            "- [ ] Reassess if P/E changes >10%",
            "- [ ] Maintain position or adjust as needed"
        ])
    
    return "\n".join(lines)


def _render_mode_info(results: Dict[str, Any]) -> str:
    """
    Render information about analysis mode and capabilities.
    
    Args:
        results: Analysis results dictionary
    
    Returns:
        Markdown formatted mode information
    """
    mode = results.get("mode", results.get("mode_used", "unknown"))
    capabilities = results.get("capabilities", [])
    data_sources = results.get("data_sources", [])
    
    lines = ["## Analysis Details", ""]
    
    # Handle None value for mode
    mode_str = mode.title() if mode is not None else "Unknown"
    lines.append(f"**Mode**: {mode_str}")
    
    if capabilities:
        lines.append("")
        lines.append("**Capabilities:**")
        for cap in capabilities:
            lines.append(f"- {cap}")
    
    if data_sources:
        lines.append("")
        lines.append("**Data Sources:**")
        for source in data_sources:
            lines.append(f"- {source}")
    
    # Add timestamp
    timestamp = results.get("timestamp")
    if timestamp:
        lines.append("")
        lines.append(f"**Analysis Timestamp**: {timestamp}")
    
    return "\n".join(lines)


def _render_footer() -> str:
    """
    Render decision framework footer.
    
    Returns:
        Markdown formatted footer
    """
    return """---

*Generated by P/E Compression Analysis Skill v0.1.0*  
*This analysis is for informational purposes only and should not be considered investment advice.*"""


def render_summary_table(results: Dict[str, Any]) -> str:
    """
    Render a summary table of key metrics.
    
    Args:
        results: Analysis results dictionary
    
    Returns:
        Markdown formatted table
    """
    lines = ["### Key Metrics", "", "| Metric | Value |", "|--------|-------|"]
    
    # Add available metrics
    metrics = [
        ("Symbol", results.get("symbol")),
        ("Current P/E", results.get("current_pe")),
        ("Historical P/E", results.get("historical_pe")),
        ("Compression %", results.get("compression_percentage")),
        ("Industry Avg", results.get("industry_average")),
        ("Mode", results.get("mode")),
    ]
    
    for name, value in metrics:
        if value is not None:
            if isinstance(value, float):
                lines.append(f"| {name} | {value:.2f} |")
            else:
                lines.append(f"| {name} | {value} |")
    
    return "\n".join(lines)

