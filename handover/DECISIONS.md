# Decisions agreed with Novartis after sign-off

Recorded 3 Nov 2026. These decisions refine the signed-off requirements
(`ECN ESG Reporting AI Requirements Finalized_27102026.docx`). Where the two
differ, follow this file. The proposal and Novartis' reply are quoted at the end.

| # | Decision | Refines |
|---|---|---|
| D1 | Datapoints are placed in report sections by an agreed rule; the register has no section column | FR-019 |
| D2 | The register's Inclusion decision sets materiality; Excluded datapoints are not covered in the report | FR-058, FR-059 |
| D3 | The build keeps the FY2025 structure, adjusted in the tool, until the FY27 blueprint arrives; content is unchanged | FR-018 |
| D4 | The UPC report uses the UPC 2026 template | FR-066 |

## D1. Section mapping for the datapoint register

Agreed by Novartis. The future report follows a similar logic as the current one:

- ESRS 2 datapoints form the opening sections, by DR: BP-1 and BP-2 → Basis of preparation; GOV-1 to GOV-4 → Corporate governance; SBM-1 to SBM-3 → Strategy; IRO-1 and IRO-2 → Materiality assessment. In the FY27 report these sections have 2, 4, 3 and 2 subsections.
- All other datapoints follow the DMA topic: one section per DMA topic. Novartis will explain some nuances with the FY27 blueprint.

In the proposal; Novartis did not comment:

- Within a topic, the Classification picks the subsection: Policy → Policies, Action → Actions, Metric and Target → the topic's table.
- The general disclosure requirements (GDR) apply to every topic.
- The 8 Included Water use datapoints have no section in the FY2025 structure and show as "not yet placed" until the FY27 blueprint. Novartis did not take up the alternative, 8.2 Pollution of water.

### Applied to the FY2025 structure until the blueprint arrives

Build choices, not reviewed by Novartis; revisit them with the blueprint.

| Register | FY2025 section |
|---|---|
| BP-1, BP-2 | 6 Basis of preparation |
| GOV-1 to GOV-4 | 7.1 Corporate governance |
| SBM-1 to SBM-3 | 7.3 Strategy |
| IRO-1, IRO-2 | 7.5 Materiality assessment |
| GDR, GDR-P, GDR-A, GDR-T, GDR-M | Every topic section: GDR-P → Policies, GDR-A → Actions, GDR-T and GDR-M → the table |
| Climate change | 8.1 Climate change |
| Pollution of water | 8.2 Pollution of water |
| Health and safety in own workforce | 9.1 Health and safety in our workforce |
| Labor rights, health and safety in the value chain | 9.2 Working conditions in our value chain |
| Patient health and safety | 9.3 Patient health and safety |
| Access to medicine | 9.4 Access to medicines |
| Responsible marketing | 9.5 Responsible marketing |
| Business conduct (Corporate culture) | 10 Business conduct |
| Workforce characteristics | 7.2.6 Our workforce; metrics → table 7.2.7 (no topic section in FY2025) |
| Water use | Not yet placed |

- ESRS 2 datapoints attach to the whole section, because today's subsections are not one per DR.
- A datapoint with several DMA topics goes to each of its topics that has a section. Talent and workforce management and SVHC appear on Included rows only together with Health and safety in own workforce or Pollution of water.
- Within a topic: Policy → Policies, Action → Actions, Metric and Target → the topic's table (its first subsection if it has no table, e.g. 9.5), everything else → Impacts, risks and opportunities.
- Climate: E1-1 → 8.1.3 Climate strategy and roadmap; E1-2 and E1-3 → 8.1.7–8.1.10 Climate risk and resilience; E1-11 → 8.1.8 and table 8.1.11. For other metrics and targets the Table reference column picks the table: E1 – Data Table → 8.1.13; E1 – Target Table, or a target without a reference → 8.1.5.

## D2. Inclusion decision

Agreed by Novartis. The gap analysis' DMA filter (Material / Not material) follows the register's Inclusion decision:

- Included (233): material; covered in the report and checked in the gap analysis.
- Excluded (66): not covered in the report and not a gap; the exit reason is shown.
- Pending (11, all flagged "Decision open"): shown as open decisions.

Coverage status stays as today.

## D3. Report structure and content

Agreed by Novartis ("Mostly accurate, and ok as described"):

- Until Novartis shares the FY27 blueprint, the build uses the FY2025 structure (86 subsections) and adjusts it in the tool (Structure Admin).
- The FY25/26 Sustainability Statement Novartis shared is the same file as the FY2025 report already in the build, so the content does not change. The FY2026 report is in preparation at Novartis and not yet available.

## D4. UPC 2026

Agreed by Novartis. The UPC report in the tool uses the UPC 2026 template
(`data/UPC 2026_WIP_draft template for Studio_2026 10 29.docx`; 2026 values are
`xx`). In its People and culture table both year columns read "2026"; the build
labels the second one "2025", like the other tables.

## Open: waits for the FY27 blueprint

- The subsections of the four ESRS 2 sections, the nuances in the topic sections, and sections for Water use and Workforce characteristics. Then revisit the FY2025 placements above and re-key the seed data (FR-018).
- With the rule above, 7.4 Stakeholder engagement and 7.6 Due diligence receive no register datapoints, and 7.2 Value chain only the workforce ones. The blueprint will show where that content goes.

## Notes for the build

- **DR numbering.** The register follows the amended ESRS. The prototype's requirement library (180 requirements) and today's pre-computed coverage use the original ESRS numbering, and about half of the DR codes found in both mean a different requirement. Example: E1-6 is "Targets related to climate change" in the register and "Gross Scopes 1, 2, 3 and Total GHG emissions" in the library. Never match register rows to the library or the coverage by DR code alone.
- **Import (FR-015).** The register is one sheet: title on row 1, header on row 3, 27 columns, one row per datapoint (310 rows, 55 DRs). Today's upload reads the first line as the header and, of these column names, recognises only DR and Standard.
- **Storage (FR-059).** One register version is about 350 KB as JSON with all 27 columns. Today every checklist version is kept in one DynamoDB item (400 KB limit), so a second full version does not fit.

## Source messages

Proposal (Flah Ahmad, AWS):

> 1. Datapoint register: section mapping
>
> The register doesn't name a report section per datapoint, so I place each one by its DMA topic (e.g. Climate change → 8.1) and its Classification (Policy → Policies, Action → Actions, Metric/Target → the topic's table). ESRS 2 datapoints go to sections 6–7 by DR (e.g. GOV-1 → 7.1 Corporate governance), and the general requirements (GDR) apply to every topic.
>
> Of the 233 Included datapoints, all but 8 find a section. The 8 Water use datapoints have no section in the FY2025 structure: I'll show them as "not yet placed" until the FY27 blueprint, or put them under 8.2 Pollution of water if you prefer.
>
> 2. Inclusion decision
>
> The gap analysis' DMA filter (Material / Not material) will follow this column: Included (233) = material; Excluded (66) = not material, with the exit reason shown; Pending (11) = shown as open decisions. Coverage status stays as today.
>
> 3. Report structure and content
>
> As you suggested, I start from the FY2025 structure (86 subsections) and adjust it in the tool until the FY27 blueprint is ready. The FY25/26 Sustainability Statement you uploaded is the same report already in the build, so the content does not change.
>
> 4. UPC 2026 template
>
> I will use it for the UPC report in the tool. Small typo: in the People and culture table, both year columns are headed "2026". I will label the second one "2025", like the other tables.

Reply (Thevi Selvanathan, Novartis SI&S):

> #1: Our future report follows a similar logic as the current one.
>
> ESRS 2 datapoints are covering more or less what's in today's "Basis of prepration" and the overall "Business model" section:
>
> BP-1 and BP-2 = One section "Basis of Preparation" split into two sub-sections
>
> GOV-1 to GOV-4 = One section "Corporate Governance" split into four sub-sections
>
> SBM-1 to SBM-3 = One section "Strategy" split into three sub-sections
>
> IRO-1 to IRO-2 = Today's Materiality Assessment section, split into two sub-sections
>
> These should form the beginning of the report, like today.
>
> The remainder of the report should indeed follow the section logic of the DMA Topic structure (with some nuances/caveats, that will become clear when we share the blueprint).
>
> #2 Inclusion decision
>
> Correct. Yes, everything that is "Excluded" does not need to be covered in the report.
>
> #3 Structure and content
>
> Mostly accurate, and ok as described.
>
> #4 UPC 2026
>
> Yes that sounds good.
