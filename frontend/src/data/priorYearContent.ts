// Prior-year (FY2025) approved baseline text, keyed by subsection ref.
//
// Sourced from the committed Novartis "Report on Nonfinancial Matters 2025"
// (data/Q1_novartis-report-nonfinancial-matters-2025.pdf). This is
// the real published prior-year narrative that the roll-forward baseline should
// show — richer than the one-or-two-sentence fallback the editor used before
// (current content with "2026" swapped to "2025").
//
// The editor's roll-forward compare (expandable "FY2025 approved" section +
// "Changes from 2025" redline) reads ReportSection.priorYearContent;
// reportSections.ts falls back to this map when a subsection override does not
// carry its own priorYearContent, and finally to the swapped-year current text.
//
// Only narrative (Text) subsections are covered — tables, images and infographics
// keep the reference-only fallback because their data lives in MDD.

export const priorYearContent: Record<string, string> = {
  // 4.0 — Introduction and use of certain terms (FY2025)
  '4.0': `Novartis AG publishes consolidated information on nonfinancial matters as required under Art. 964a of the Swiss Code of Obligations.

Unless the context requires otherwise, the words "we," "our," "us," "Novartis," "Group," "Company," and similar words or phrases in this report refer to Novartis AG and its consolidated affiliates. However, each Novartis affiliate is legally separate from all other Novartis affiliate companies and manages its business independently through its respective board of directors or similar supervisory body or other top local management body, if applicable.

References to "net-zero" are based on the definition of the SBTi Corporate Net-Zero Standard, referring to the reduction of GHG emissions for defined activities by at least 90% consistent with the goal of the Paris Agreement to limit the global temperature increase to 1.5°C compared with pre-industrial levels, and neutralizing unavoidable emissions with carbon removal credits (up to 10% of GHG emissions compared with the base year). All product names appearing in italics are trademarks owned by or licensed to Novartis.`,

  // 5.0 — Forward-looking statements (FY2025)
  '5.0': `This Novartis Report on Nonfinancial Matters contains certain forward-looking statements within the meaning of the United States Private Securities Litigation Reform Act of 1995 that can generally be identified by words or phrases such as "potential," "expect," "will," "plan," "pipeline," "may," "could," "going forward," "target," "believe," "goal," "estimate," "intend," or similar expressions, or by express or implied discussions regarding potential new products, potential new indications for existing products, or regarding potential future revenues from any such products or indications.

Such forward-looking statements are based on the current beliefs and expectations of management regarding future events, and are subject to significant known and unknown risks and uncertainties. Should one or more of these risks or uncertainties materialize, or should underlying assumptions prove incorrect, actual results may vary materially from those set forth in the forward-looking statements. You should not place undue reliance on these statements.

Novartis is providing the information in these materials as of this date and does not undertake any obligation to update any forward-looking statements as a result of new information, future events or otherwise.`,

  // 7.2.9 — Value chain — Reporting criteria (FY2025)
  '7.2.9': `Headcount: All employees in Novartis payroll systems at the end of the reporting period, excluding the Board of Directors, Foundation board members and individuals on unpaid leave. Full-time equivalent positions are calculated by dividing the total number of hours that employees have worked by the standard number of hours for a full-time employee.

Turnover: Percentage of employees who left Novartis during the reporting period, calculated based on the average headcount using monthly figures. Voluntary turnover also excludes redundancies, divestments, retirements and deaths. Gender representation reflects the proportion of female and male employees as a percentage of total headcount at the end of the reporting period; the metric excludes employees who prefer not to disclose their gender.

Operating sites: Number of sites worldwide where Novartis had a physical presence at the end of the reporting period. Manufacturing sites: Number of manufacturing sites approved for the commercial supply of Novartis products as at the end of the reporting period.`,

  // 7.6.6 — Due diligence — Reporting criteria (FY2025)
  '7.6.6': `Total allegations: All claims or assertions of potential misconduct raised through one of the SpeakUp reporting channels during the reporting period. Allegations that are not backed up by sufficient evidence or that fail to meet the criteria for misconduct, as assessed by the SpeakUp Office, cannot be investigated and are excluded.

Higher-risk allegations substantiated: Substantiated allegations, in total and for selected subcategories, related to higher-risk misconduct cases closed during the reporting period, which may include allegations raised in previous years. Multiple allegations may be comprised in one case. An allegation is considered higher risk if it relates to potential misconduct by a senior leader or manager, and/or with potential disruptive reputational impact / significant financial impact, and/or related to sexual harassment, discrimination or retaliation.`,

  // 8.1.6 — Climate change — Reporting criteria (FY2025)
  '8.1.6': `Where applicable, our climate-related targets cover the following greenhouse gases: carbon dioxide (CO2), methane (CH4), nitrous oxide (N2O), hydrofluorocarbons (HFCs). We do not generate significant emissions related to perfluorocarbons (PFCs), sulfur hexafluoride (SF6) and nitrogen trifluoride (NF3).

Scope 1 and 2 GHG emissions from energy: Scope 1 and 2 GHG emissions excluding Scope 1 process emissions. It considers emissions from energy consumption and is reported in thousands of metric tons of CO2e. Scope 1 and 2 GHG emissions: Scope 1 and Scope 2 market-based GHG emissions excluding emissions from fugitive sources, in line with the SBTi Corporate Net-Zero Standard.

Supplier emissions covered by contracts that include environmental criteria: Scope 3 GHG emissions allocated to suppliers that have accepted our environmental sustainability criteria as a percentage of total supplier-related Scope 3 GHG emissions at the end of the previous reporting period.`,

  // 8.1.12 — Climate risk and resilience — Reporting criteria (FY2025)
  '8.1.12': `Scenarios used for climate risk and resilience analysis: For physical risks we use IPCC SSP1-2.6 (low-emissions, central estimate +1.8°C by 2100), IPCC SSP2-4.5 (intermediate, +2.7°C) and IPCC SSP5-8.5 (very high, +4.4°C). For transition risks and opportunities we use IEA Net Zero Emissions by 2050, IEA Announced Pledges and IEA Stated Policies scenarios for carbon pricing and renewable electricity, and BNEF scenarios for the pricing of carbon removal credits.

Total potential decrease in property, plant and equipment / inventory value: Potential financial impact from acute physical climate hazards (flooding and cyclones) calculated using site-specific values and geolocation data combined with third-party climate damage functions from Jupiter Intelligence ClimateScore Global (version 3.2.0), expressed in USD. Transition-risk operating-expense and revenue effects combine projected emissions with carbon-price and carbon-removal-credit forecasts under the respective scenarios.`,

  // 8.2.5 — Pollution of water — Reporting criteria (FY2025)
  '8.2.5': `Own manufacturing sites meeting water quality standards: Proportion of manufacturing sites that met the three levels of the water quality maturity ladder as a percentage of the total number of Novartis manufacturing sites at the end of the reporting period. Manufacturing sites without discharges of APIs — i.e., cell and gene therapy and radioligand therapy manufacturing sites — are deemed low risk. Sites solely handling antibodies (large molecules) are exempt from performing effluent risk assessments.

High-risk suppliers meeting water quality standards: Proportion of our high-risk suppliers that met all three levels of the water quality maturity ladder as a percentage of all high-risk suppliers. High-risk suppliers are strategic (long-term relationship), tactical (key technology provider), or antibiotics providers, and are required to report progress through the External Partner Risk Management program.`,

  // 9.1.5 — Health and safety in our workforce — Reporting criteria (FY2025)
  '9.1.5': `Employees covered by an internally validated HSE system: Percentage of full-time equivalent positions at the end of the reporting period covered by an internally validated HSE system, collected through internal HSE and HR systems and the risk and control framework register.

Lost-time injury and illness rate: Number of cases in which a work-related injury or illness prevented an individual from working for at least one day multiplied by 200 000 over total standardized work hours. Total recordable case rate: Number of recordable cases (medical treatment beyond first aid, restriction of duty, job transfer, loss of consciousness, lost time or a fatality) multiplied by 200 000 over total standardized work hours. Rates are tracked separately for employees and third-party personnel. Fatalities are work-related fatalities reported separately for employees, third-party personnel and contractors.`,

  // 9.2.5 — Working conditions in our value chain — Reporting criteria (FY2025)
  '9.2.5': `Human and labor rights remediation actions: Total number of remediation actions agreed with external partners during the reporting period, and to be completed by them, in response to instances of noncompliance with human and labor rights, as defined in our Third Party Code and identified by our EPRM process.

Human and labor rights remediation actions overdue: Proportion of human and labor rights remediation actions not closed by the due date as a percentage of the sum of the total number of remediation actions closed during the reporting period and the total number of remediation actions still open at the end of the reporting period.`,

  // 9.3.5 — Patient health and safety — Reporting criteria (FY2025)
  '9.3.5': `Total inspections: All inspections conducted by health authorities at facilities owned by Novartis during the reporting period. Inspections found to be acceptable: An acceptable inspection outcome allows Novartis to continue operating while remediating the findings (if any); this metric represents the proportion of inspections found to be acceptable as a percentage of the total conducted.

Total recalls: Number of times during the reporting period that we initiated a recall of a Novartis product, including approved medicines and investigational treatments undergoing clinical trials. A single recall can cover multiple countries. A Class I recall is associated with a potential severe health risk to patients and a Class II recall with a potential moderate risk to patients.`,

  // 9.4.5 — Access to medicines — Reporting criteria (FY2025)
  '9.4.5': `Patients reached: Number of patients reached with medicines registered and commercialized by Novartis globally, including established medicines. The calculation is based on therapy volumes combined with assumptions on treatment dosage, duration of treatment and compliance rate. It includes patients reached through third-party sales as recorded in our financial system, as well as through patient support programs, donations and access foundations.

Countries with products sold: Number of countries with third-party sales of Novartis products during the reporting period. It includes countries with sales above USD 1 million and ongoing operations, based on third-party sales as recorded in our financial system and cross-checked with countries and areas defined by the United Nations Statistics Division.`,

  // 10.5 — Business conduct — Reporting criteria (FY2025)
  '10.5': `Code of Ethics — Employees trained and certified: Proportion of active internal Novartis employees and third-party personnel who have completed Novartis Code of Ethics training, expressed as a percentage of all active internal Novartis employees and third-party personnel assigned to the training during the reporting period.

Employees in countries or legal entities not yet integrated into Novartis systems are excluded from the metric; these employees undergo a separate training outside of the learning management system. External freelancers and service providers are also excluded.`,

  // 13.0 — Independent limited assurance report (FY2025)
  '13.0': `To the Board of Directors of Novartis AG, Basel. We have undertaken a limited assurance engagement on Novartis AG's Sustainability Information on pages 12, 18, 22, 25, 27, 30, 32, 33, 35, 36 and 39 marked with the symbol ∆ in the Novartis Report on Nonfinancial Matters for the year ended December 31, 2025.

Based on the procedures we have performed and the evidence we have obtained, nothing has come to our attention that causes us to believe that the Sustainability Information in the Report for the year ended December 31, 2025, is not prepared, in all material respects, in accordance with the Reporting Criteria. We performed a limited assurance engagement in accordance with ISAE 3000 (Revised) and, in respect of greenhouse gas emissions, ISAE 3410.

KPMG AG — Tobias Pachlatko, George Richards. Basel, February 3, 2026.`,

  // 2.0 — Chair and CEO's letter (FY2025)
  '2.0': `2025 was another strong year for Novartis. We delivered meaningful impact for patients around the world while remaining focused on our strategy. In an environment shaped by rapid scientific progress and evolving policy — including our recent pricing agreement with the US government — we continued to lead in our core therapeutic areas and technology platforms, advance our pipeline, and execute with discipline to deliver long-term value for patients and shareholders.

In 2025, we reached more than 300 million patients worldwide and continued to engage closely with a broad range of stakeholders. Financially, we delivered 8% sales growth and 14% core operating income growth in constant currencies, generating USD 17.6 billion in free cash flow. This strong performance enabled continued investment in R&D and targeted acquisitions, and allows Novartis to propose a dividend increase of 5.7% to CHF 3.70 at the upcoming Annual General Meeting.

Throughout the year, we remained focused on delivering against our commitment to social impact and sustainability. Among our achievements, we further reduced our greenhouse gas emissions, in line with our goal to be net-zero by 2040. In addition, each of our new medicines was launched with a strategy designed to achieve broad patient access. We also remain committed to continually strengthening our governance and ethical standards in close dialogue with our stakeholders.

Giovanni Caforio, Chair of the Board of Directors · Vas Narasimhan, Chief Executive Officer`,

  // 6.1 — Basis of preparation — Introduction & basis for selecting content
  '6.1': `The Novartis Report on Nonfinancial Matters is prepared in accordance with Art. 964a et seq. of the Swiss Code of Obligations (SCO). We are exempt from the due diligence and reporting obligations in relation to minerals and metals from conflict-affected areas as we do not exceed the import and processing quantity thresholds specified by the Federal Council. The report is prepared with reference to the Global Reporting Initiative (GRI) standards. The sections referenced in the TCFD index constitute our report on climate-related financial risks and opportunities, as defined by the Swiss Ordinance on Climate Disclosures.

The content in this report was reviewed by senior management and the Executive Committee of Novartis (ECN) prior to approval by the Board of Directors. The Report on Nonfinancial Matters is published in conjunction with our Annual Report, which is filed with the SIX Swiss Exchange. It was submitted to shareholders for an advisory vote at the Company's Annual General Meeting on March 6, 2026.

This report contains information on the topics deemed material in our materiality assessment concluded in 2025 and thus in scope of our reporting obligations under the SCO. Our 2025 materiality assessment applied the double materiality principle, covering topics required to understand business performance and results (financial materiality) and the impact of Novartis on people and the environment (impact materiality). The terms "material" and "materiality" are used in the context of the SCO and do not indicate materiality under US federal law or any other applicable regulations.`,

  // 6.2 — Basis of preparation — Scope, data collection, external assurance
  '6.2': `This report covers all consolidated entities of Novartis AG, as well as information relating to other parts of our value chain. Our annual reporting period is from January 1 to December 31. For greenhouse gas emissions, data is measured in accordance with the GHG Protocol unless adjustments are required to comply with local regulations. For energy use and Scope 1 and 2 emissions, data covers operations where Novartis has operational control. For Scope 3 emissions, we rely on a combination of primary data from external partners and information derived from an environmentally extended input-output model; in 2025 the share calculated using primary data increased by 2 ppts to 40%.

We have established procedures for gathering, collecting and aggregating data for nonfinancial performance metrics on a monthly, quarterly and annual basis. At the time of publication, full-year data for most environmental metrics was not yet available; our 2025 figures therefore combine actual data for part of the year with estimates based on prior-year trends for up to three months. We have included comparative data for our performance metrics for 2024, and comparative data for certain environmental, energy, Scope 3, workforce health and safety, and patient safety metrics has been amended and clearly indicated.

KPMG AG has provided limited assurance in accordance with the International Standard on Assurance Engagements (ISAE) 3000 (revised) and ISAE 3410 on the metrics in the report marked with ∆. KPMG's independent assurance report is included in the appendix.`,

  // 7.1.1 — Corporate governance — Board oversight
  '7.1.1': `Novartis is committed to effective corporate governance, and our corporate governance framework is intended to support sustainable financial performance and long-term value creation for our shareholders, patients, employees and other stakeholders based on our Values and Behaviors.

Ultimate responsibility for all nonfinancial matters lies with our Board of Directors. The Board has delegated part of this responsibility to its Governance, Sustainability and Nomination Committee (GSNC), which consists of four independent Board members. The GSNC oversees the Group's strategy and governance on sustainability matters, at least annually reviews performance against relevant ESG reporting frameworks and indices, reviews emerging sustainability trends, and advises the Board and management.

Several other Board committees have responsibilities related to nonfinancial matters. The Audit and Compliance Committee (ACC) is responsible for internal controls, nonfinancial data, and compliance processes. The Risk Committee oversees risk management including sustainability risks (until its dissolution with effect from the 2026 AGM). The Compensation Committee determines how nonfinancial matters are incorporated into ECN compensation. Seven members of the Board (58%) have competencies on ESG matters. In 2025, social impact and sustainability topics, including climate, were a standing agenda item for the GSNC.`,

  // 7.1.2 — Corporate governance — Management
  '7.1.2': `Operational responsibility for nonfinancial matters lies with the Executive Committee of Novartis (ECN). This includes implementation of our social impact and sustainability strategy, management of ESG-related initiatives and risks, overseeing cooperation between functions, and ensuring consideration for nonfinancial matters is included in all relevant management decisions.

The ESG Committee is a subcommittee of the ECN, chaired by our CEO. This committee meets every two months to review, among other things, ESG performance, strategy, reporting and disclosures. ESG factors are integrated into our Enterprise Risk Management (ERM) framework, as well as internal policies and controls, to reduce risk in areas such as human rights, health and safety, business conduct, and environmental sustainability.

To support the implementation of our social impact and sustainability strategy, we also have dedicated teams and specialists in Corporate Affairs, Finance and operational units.`,

  // 7.1.5 — Integration of nonfinancial matters into executive compensation
  '7.1.5': `The compensation of ECN members (including the CEO) comprises fixed pay — including an annual base salary, pension and other benefits — as well as a variable annual incentive and a long-term incentive, which are performance based.

The annual incentive of the CEO is based on a balanced scorecard of financial performance measures (60% weighting) and measures related to strategic objectives (40% weighting). The strategic objectives consist of four equally weighted measures, one representing social impact and sustainability-related targets: "Strengthen foundations (ESG, Human Capital)," which includes performance against our targets for absolute GHG emissions reductions and other nonfinancial matters. Balanced scorecards for other ECN members contain the same Company financial performance measures and weighting, plus individual qualitative and quantitative targets.

The long-term incentive for the CEO and the other ECN members has four equally weighted performance measures, three on financial performance and one on innovation. At the end of the reporting period, the Board determines the CEO's compensation and the Compensation Committee determines the compensation of the other ECN members.`,

  // 7.2.1 — Value chain — Supply chain
  '7.2.1': `Novartis is an innovative medicines company engaged in the research, development, manufacturing, distribution, marketing, and sale of a broad range of pharmaceutical products. Our purpose is to reimagine medicine to improve and extend people's lives. Headquartered in Basel, Switzerland, we have 184 operating sites worldwide. Our products are sold in approximately 120 countries, and medicines we have registered and commercialized reached more than 300 million people worldwide. In 2025, Novartis achieved net sales from continuing operations of USD 54.5 billion, and net income from continuing operations of USD 14.0 billion.

We buy goods and services required to develop, manufacture and market our medicines. To do so, we work with suppliers, contractors and other business partners worldwide and maintain multiple sources for key inputs and raw materials to reduce supply continuity risks. Our largest spend on these external partners is in the US and Switzerland, followed by other countries in our integrated supply chain including China, the UK, Germany, India and Austria. We require all our external partners to comply with applicable laws and regulations, as well as to adhere to our own standards regarding product quality; business conduct; human rights; and health, safety and environment.`,

  // 7.2.2 — Value chain — Research and development
  '7.2.2': `The discovery and development of a new drug usually requires approximately 10 to 15 years from the initial research to bringing a drug to market. This includes approximately six to eight years from Phase I clinical trials to market entry. At each of these steps, there is a substantial risk that a therapeutic candidate will not meet the requirements to progress further, in which case we may be required to abandon a development program in which we have made a substantial investment.

Our research and early development program is conducted by our Biomedical Research organizational unit, responsible for the discovery and first clinical evaluation of new medicines. Our Development organizational unit oversees and executes drug development activities in our core therapeutic areas, working collaboratively with Biomedical Research, our commercial units and other parts of the Company on our overall pipeline strategy. Confirmatory Development includes trials aimed at confirming the safety and efficacy of the drug in a given indication, leading up to submission of a dossier to health authorities for approval.`,

  // 7.2.3 — Value chain — Regulatory submission and approval
  '7.2.3': `Regulatory authorities around the world administer numerous laws and regulations regarding the testing, approval, manufacturing, importing, labeling and marketing of drugs, and review the safety and efficacy of pharmaceutical products. Extensive controls exist on the nonclinical and clinical development of pharmaceutical products.

These regulatory requirements, and their implementation by local health authorities, are a major factor in determining whether a substance can be developed into a marketable product, and the amount of time and expense associated with that development. To register a pharmaceutical product, a registration dossier containing evidence establishing the safety, efficacy and quality of the product must be submitted to regulatory authorities. Generally, a therapeutic product must be registered in each country in which it will be sold. This registration process is overseen by our Development organizational unit and generally takes between six months and several years. Once approved, we are generally granted exclusive rights to market and sell the drug for a defined period.`,

  // 7.2.4 — Value chain — Production
  '7.2.4': `Our primary goal is to ensure the uninterrupted and timely supply of medicines that meet all product specifications and quality standards, and that are manufactured in the most cost-effective and sustainable manner. The manufacturing of our products is highly regulated by governmental health authorities around the world, including the US Food and Drug Administration (FDA) and European Medicines Agency (EMA). Many of our products involve technically complex manufacturing processes or require highly specialized raw materials.

Our Operations organizational unit oversees the production, quality and supply chain of our products through a network of 31 manufacturing sites, as well as through external suppliers and warehouse and distribution centers. We produce raw materials for manufacturing in-house or purchase them from third-party suppliers. Where possible, we maintain multiple supply sources so that the business is not dependent on a single or limited number of suppliers. We monitor market developments that could adversely affect the supply of essential materials, and our suppliers of raw materials are required to comply with applicable regulations and Novartis quality standards.`,

  // 7.2.5 — Value chain — Marketing and sales
  '7.2.5': `Although specific distribution patterns vary by country, Novartis generally sells its prescription drugs primarily to drug wholesalers, retailers, private health systems, government agencies, managed care providers, pharmacy benefit managers, and government-supported healthcare systems. We reach healthcare professionals and patients in many markets and across our core therapeutic areas through integrated channels including field force operations, patient support programs and Novartis-owned digital platforms.

The marketplace for healthcare is constantly evolving. Customer groups beyond prescribers have an increasing influence on treatment decisions and guidelines, while patients continue to become more informed stakeholders in their healthcare decisions. Novartis is responding by adapting our business practices to engage appropriately with patients, customer groups and other stakeholders, including by delivering innovative solutions to drive education, access and improved patient care.`,

  // 7.2.6 — Value chain — Our workforce
  '7.2.6': `We employed 75 267 people (in full-time equivalent positions) on December 31, 2025. We rely on identifying, attracting, developing and retaining a diverse, highly skilled workforce — including high-quality researchers and development specialists, physicians, and skilled employees with key capabilities — across our business and functions to achieve our objectives.

Our total headcount was 77 052, with a gender representation of 52% female / 48% male. Women represented 42% of our Board of Directors and 20% of our Executive Committee. Turnover was 13%, of which 7% was voluntary. Novartis makes employment decisions based on merit and relevant job-related factors, including the skills, qualifications and experience of the individual, without regard to sex/gender, race, ethnicity, or any other legally protected or personal characteristic unrelated to the job.`,

  // 7.3.1 — Strategy — Business environment
  '7.3.1': `Advances in both medical science and digital technologies are opening opportunities for new treatments and more efficient drug discovery. At the same time, pressure on pricing is increasing due to regulatory changes, government funding constraints and tariffs on international trade. Meanwhile, as demand for high-quality treatment is rising, many people around the world still struggle to access adequate healthcare and the medicines they need.

The major trends shaping our business environment include: scientific and technological innovation, where rapid progress in medical science, data and AI is opening opportunities for breakthrough treatments; policy, economic and geopolitical pressures, where trade protectionism, sanctions and evolving drug-pricing legislation such as the US Inflation Reduction Act may disrupt supply chains and change how governments pay for medicines; and health challenges, where demand for quality healthcare continues to rise in areas such as oncology, cardiovascular and immunology, even as the World Health Organization estimates that almost 2 billion people worldwide do not have regular access to essential medicines.`,

  // 7.3.2 — Strategy — Strategic focus areas
  '7.3.2': `As part of our core strategy, we focus on four therapeutic areas: cardiovascular, renal and metabolic; immunology; neuroscience; and oncology. Each has strong growth potential and high unmet patient needs. This focus allows us to build depth in our chosen areas, and to use our scientific expertise to discover and develop new treatments, intervene earlier in the progress of a disease and improve the quality of life for patients.

To support these focus areas, we invest in technology platforms to help us deliver future treatments. We focus on two established platforms — chemistry and biotherapeutics — in addition to three advanced platforms: radioligand therapy, xRNA, and cell and gene therapy. We focus on four priority markets: US, China, Germany and Japan, which together account for most of the expected growth in global healthcare spending through 2030.`,

  // 7.3.3 — Strategy — Strategic priorities
  '7.3.3': `We have set three strategic priorities. First, deliver high-value medicines to accelerate growth: we aim to increase growth driven by continued strong momentum in our existing portfolio and key upcoming launches, and over the longer term through delivering high-value medicines that sustain and replace our existing growth drivers.

Second, embed operational excellence to deliver returns: in an increasingly competitive environment, we are simplifying processes and reducing costs to become more efficient and effective in our decision-making and to free up resources for investment in new medicines. Third, strengthen our foundations: we continue to invest in the foundations of our long-term success, strengthening our culture to attract and retain talent, developing artificial intelligence capabilities across our value chain, and continuing to build trust with stakeholders and society.`,

  // 7.3.4 — Strategy — Social impact and sustainability strategy
  '7.3.4': `Social impact and sustainability drive long-term value for our business by extending access to our medicines to underserved patients. Our social impact and sustainability strategy defines how we aim to create value for patients and society, by focusing on maximizing the impact of our medicines to unlock better health for overlooked communities.

Supporting this are the fundamentals of how we aim to do business: protecting the planet while advancing human health; advancing our people and culture to achieve shared success; and embedding ethics across the business. Our work is part of a broader ecosystem, in which we partner with governments, academia, civil society and healthcare providers to strengthen health systems. The greatest health impact comes from embedding principles of inclusion — such as clinical trial representation, creating access strategies for our product launches, and supporting health system strengthening — across every stage of our activity, from R&D to commercialization.`,

  // 7.4 — Stakeholder engagement
  '7.4': `We maintain structured and ongoing engagement with stakeholders across our value chain, within our global organization and in countries across various jurisdictions. This is part of both our due diligence efforts and our regular business activities. Engagement is embedded in our governance and operational processes and executed through teams operating at our headquarters and in countries around the world, ensuring that stakeholder perspectives inform our strategic decision-making.

We engage with investors on our strategic direction, sustainable value creation and ESG performance, focusing on our top 100 institutional investors who hold around 60% of our shares. We engage with employees to foster a safe, healthy and inclusive work environment through Company-wide meetings, surveys, training and dialogue with employee representatives and unions. We engage with suppliers and business partners to promote responsible business conduct through questionnaires, audits, capacity-building and grievance mechanisms. We also engage with healthcare professionals and systems, patient communities, and policymakers and regulators to improve access to medicines and support responsible innovation.`,

  // 7.5.1 — Materiality assessment — Intro
  '7.5.1': `Implementing our business model and strategy results or may result in impacts on people and the environment. The regulation of our activities and changes in our business environment may turn these impacts into risks or opportunities for our business.

Our materiality assessment, conducted with a double materiality perspective and concluded in 2025, covered risks and opportunities arising from our value chain (financial materiality) as well as the impact of Novartis on people and the environment (impact materiality). The assessment was performed at a Company level using country- and site-specific data, and included insights from stakeholder engagement and due diligence processes, peer comparisons, and interviews with internal subject-matter experts. We developed a list of potential impacts, risks and opportunities over the short, medium and long term, assessed them using systematic scales for severity/magnitude and likelihood, and reviewed the results in workshops before review by the ESG Committee and approval by the ACC.`,

  // 7.5.2 — Materiality — Enterprise risk management
  '7.5.2': `Our ERM framework is designed to generate a complete view of strategic and operational risks for our Company and drive a culture of informed risk-taking that advances our strategy. Our annual ERM process is based on four steps: understanding and adapting to the changing dynamics of our external environment; identifying, assessing and analyzing potential risks to the success of our strategy; setting a clear risk appetite for each risk; and taking actions to achieve our target risk exposure.

Our ERM approach takes into consideration our social impact and sustainability risks, including those identified in our climate, nature and human rights analyses and assessments. It includes monitoring the actions taken to mitigate the risks in these areas, as well as the effectiveness of these actions.`,

  // 7.5.3 — Materiality — Climate-related scenario analysis
  '7.5.3': `We assess the resilience of our strategy to future climate change impacts through quantitative and qualitative scenario analysis using low-, medium- and high-emission pathways, in line with the recommendations of the TCFD. The analysis covers both physical risks and transition risks and opportunities.

Physical risks in our own operations were evaluated based on a shortlist created in 2024 using a third-party platform to screen our operating sites and warehouses for exposure to 18 temperature-, water- and wind-related acute and chronic risks. We did not conduct a full screening in 2025 as there were no significant changes in the list of sites or climate data used. Our last full screening of transition risks and opportunities also took place in 2024. We did not identify additional material physical or transition risks or opportunities for the current reporting period, and continued to strengthen and refine our existing analysis regarding the quantification of anticipated financial effects.`,

  // 7.5.4 — Materiality — Nature-related impact analysis
  '7.5.4': `In 2024, we conducted an initial assessment of nature-related impacts, risks and opportunities in our supply chain and own operations using the Locate, Evaluate, Assess and Prepare approach developed by the Taskforce on Nature-related Financial Disclosures. We completed an assessment of our downstream impacts in 2025.

Our analysis to date identified potentially material impacts on nature from pollution of water. We continue to assess the nature-related pillar of our environmental sustainability strategy as our understanding of impacts, risks and dependencies matures.`,

  // 7.5.5 — Materiality — Human rights saliency
  '7.5.5': `Using the risk-saliency principles set out by the United Nations Guiding Principles on Business and Human Rights (UNGPs), we conduct an annual human rights risk assessment to identify and prioritize the most severe potential impacts on people across our value chain. We evaluate and rank risks through stakeholder interviews, evidence reviews and a cross-functional workshop. Prioritizing our most salient human rights topics enables us to focus on due diligence where the risk of adverse impacts to people is highest.

Our 2025 assessment reaffirmed our existing human rights priorities, which continue to represent the areas with the most significant potential impacts on human rights. These include labor rights risks in the value chain and health risks related to our core business activities.`,

  // 7.6.1 — Due diligence — Intro
  '7.6.1': `Novartis has put in place due diligence processes aimed at identifying, assessing, remediating and monitoring negative impacts on people and the environment across its value chain. These processes are designed to secure adherence to Company policies and external regulations by employees and external partners, supported by management systems.

We operate an integrated assurance model overseen by our global Ethics, Risk and Compliance (ERC) function, working together with Internal Audit, with three lines of assurance: employees addressing risks arising from business activities (first line); second-line roles providing expertise, monitoring and challenge, coordinated by the Corporate ERC Assurance Team; and Internal Audit providing independent assurance to the Board and Executive Committee (third line). To monitor and address impacts in our supply chain, our External Partner Risk Management (EPRM) framework is a globally applied process covering business conduct; contractor safety; health, safety and environment; human and labor rights; and raw materials certification, renewed every three years or earlier if triggers indicate a potential risk.`,

  // 7.6.2 — Due diligence — Human rights due diligence
  '7.6.2': `To understand and address negative impacts on human rights throughout our value chain, we conduct ongoing human rights due diligence and have policies and management systems in place. These support our commitment to respecting human rights as articulated in our Human Rights Commitment Statement, in line with the principles set out in the UNGPs and the OECD Guidelines for Multinational Enterprises.

Our commitment includes internationally recognized human rights, including those contained in the International Bill of Human Rights and the International Labour Organization's (ILO) core labor rights conventions, including the Minimum Age Convention (no. 138) and the Worst Forms of Child Labour Convention (no. 182). We are also signatories to the United Nations Global Compact (UNGC) and report annually on our progress.`,

  // 7.6.3 — Due diligence — Environmental due diligence
  '7.6.3': `To understand and address negative impacts on the environment along our value chain, we have established a structured due diligence framework that covers environmental matters and is designed to ensure compliance with applicable regulations, internal governance standards and internationally recognized best practices. Our due diligence practices directly support our sustainable supply chain management, particularly in the areas of climate action and pollution.

Our global Health, Safety and Environment (HSE) Policy mandates environmental protection, requiring strict adherence to legal obligations and continuous improvement in resource efficiency. Our environmental management system is aligned with the principles of ISO 14001. External partners are contractually required to meet our environmental standards through our Third Party Code. We conduct HSE audits of supplier manufacturing sites following a risk-based approach; where our expectations are not met, we collaborate with the supplier on a corrective action plan, and where critical issues remain unresolved, contractual relationships may be suspended or terminated.`,

  // 7.6.4 — Due diligence — Grievance mechanism
  '7.6.4': `Novartis operates a formal grievance mechanism managed by our SpeakUp Office as part of our due diligence process. This mechanism enables internal and external stakeholders to confidentially report allegations of misconduct, including those about human and labor rights, related to our operations or supply chain. Allegations can be submitted anonymously through a web-based platform and telephone lines managed by an independent third-party provider, available at all times, or via internal channels.

The mechanism is designed to protect those who use it in good faith against retaliation, and maintains confidentiality throughout. All allegations are subject to structured investigation protocols; higher-risk cases are investigated centrally by dedicated investigators, and lower-risk cases locally. Confirmed breaches trigger remedial actions, and the SpeakUp Office reports regularly to the ECN and ACC. In 2025, we recorded 1 116 new allegations of potential misconduct and substantiated 745 higher-risk allegations, whether reported during the reporting period or in previous years.`,

  // 8.1.1 — Climate change — Impacts, risks and opportunities
  '8.1.1': `The research, development, production and commercialization of medicines generate GHG emissions that contribute to the effects of climate change, which can influence public health and the resilience of healthcare systems. Direct emissions arise from fossil fuel combustion at our operating sites and from Company-owned vehicles (Scope 1), while indirect emissions come from consumption of energy from nonrenewable sources (Scope 2). Most of our total emissions (95%) in 2025 originated outside our direct operations (Scope 3); 77% of these were linked to the purchase of goods and services.

Physical risks from climate-related natural hazards can create financial impacts due to damage to our assets or to our dependence on raw materials, energy and water in manufacturing. The transition toward net-zero exposes our business to various transition risks and opportunities, including reputational risk if we fail to meet climate commitments; policy and legal risk from carbon pricing and climate-related litigation; market and technology risk from uncertainty in the price and availability of carbon removal credits; and energy-source opportunities from renewable energy. Implementing our climate transition plan can significantly reduce our exposure to these transition risks.`,

  // 8.1.2 — Climate change — Policies
  '8.1.2': `We aim to reduce our GHG emissions to mitigate our impacts and become a net-zero company by 2040. Our near- and long-term ambitions are consistent with the goal of the Paris Agreement to limit the global temperature increase to 1.5°C compared with pre-industrial levels and were validated by the Science Based Targets initiative (SBTi) in 2024. We measure progress through our absolute GHG emissions reductions across our value chain compared with a 2022 base year.

We have been implementing commitments to cover all our electricity with renewable electricity arrangements, such as power purchase agreements, by 2025, and to transition our fleet to electric vehicles by 2030 where technically feasible. These commitments are in line with our pledges to RE100 and EV100. Our actions are supported by our HSE Policy, and we formalize expectations toward our suppliers by incorporating environmental sustainability criteria into supplier contracts, requiring them to reduce their environmental impact and set decarbonization targets.`,

  // 8.1.3 — Climate change — Climate strategy and roadmap
  '8.1.3': `We have established a transition plan to achieve our near- and long-term targets that were validated by the Science Based Targets initiative (SBTi) in 2024. To reduce absolute Scope 1 and 2 GHG emissions 90% by 2030 from a 2022 base year — and maintain a minimum of 90% reductions from 2030 through 2040 — we aim to reduce energy consumption and transition to renewable energy. We apply a shadow carbon price of USD 100/tCO2e in decisions on capital expenditure over USD 20 million.

To reduce absolute Scope 3 GHG emissions 42% by 2030 and 90% by 2040 from a 2022 base year, we focus on purchased goods and services, upstream transportation and distribution, business travel and employee commuting, which accounted for 87% of our Scope 3 emissions in 2025. We plan to engage our suppliers, prioritize low-carbon freight options such as sea and rail, and promote more efficient and low-carbon business travel. Across all scopes, we follow a clear mitigation hierarchy — avoidance, substitution, then neutralization through carbon removal credits — and anticipate that carbon removal credits will represent less than 10% of our total 2022 base year emissions for Scope 1 and 2 by 2030 and for all scopes by 2040.`,

  // 8.1.4 — Climate change — Actions
  '8.1.4': `In 2025, our combined Scope 1 and 2 GHG emissions decreased by 14% from the prior year and 45% from the 2022 baseline. We reduced our Scope 1 emissions by implementing projects to improve energy efficiency, adopt renewable energy solutions and reduce consumption of natural resources, supported by capital expenditure of USD 45.4 million. To address Scope 2 emissions, we increased our electricity sourced from renewables to 100% of total electricity sourced in 2025, in line with our RE100 commitment, compared with 96% in the prior year.

We also achieved our 2025 target to become carbon neutral from energy in our own operations, neutralizing residual emissions with biomethane certificates (70.8 ktCO2e), Sustainable Aviation Fuel certificates (4.9 ktCO2e) and carbon removal credits (124.3 ktCO2e) certified under recognized carbon crediting programs. In 2025, our Scope 3 emissions decreased by 4% from the prior year and 17% from the 2022 baseline; suppliers with contracts including environmental sustainability criteria covered 97% of Scope 3 emissions. Overall, in 2025 we reduced Scope 1, 2 and 3 emissions by 19% compared with the 2022 baseline.`,

  // 8.1.7 — Climate risk and resilience — Intro
  '8.1.7': `We conduct an annual climate scenario analysis to identify and assess the potential effects of climate-related risks and opportunities — both in our own operations and through our business relationships or products — on our future financial performance. Results from our 2025 analysis show that climate change presents both risks and opportunities for Novartis, and that our current strategy and financial position remain resilient to the possible effects of climate change on our business.

Our scenario analysis covers all our operating sites and we assess risks across three time horizons: short term (up to one year, aligned with our financial statements); medium term (up to 2030, aligned with our near-term targets); and long term (up to 2050, aligned with our 2040 net-zero target and global net-zero pathways). Significant areas of uncertainty include assumptions about future policy and regulatory developments, the timing and scale of technological change, the reliability of forecast data, and potential market responses to transition and physical climate risks.`,

  // 8.1.8 — Climate risk and resilience — Financial planning and effects
  '8.1.8': `Climate-related issues can affect our financial performance and position through changes in cost structure, supply chain resilience or changing demand for our medicines. Near-term effects may be limited but could increase due to investments in low-carbon technologies; in the long term, these investments reduce exposure to carbon pricing, regulation and volatility in energy prices.

In 2025, climate-related events did not cause material business interruptions or material adjustments to carrying values, and these events are not anticipated to result in any such adjustments in 2026. Our environmental sustainability strategy is fully integrated into our business strategy and assessed via our budgeting and strategic planning processes. Based on our scenario analysis, the effects from climate-related risks and opportunities on our financial position and performance across short, medium and long-term horizons are expected to remain modest: potential changes in the value of property, plant and equipment and of inventories are each estimated to be within the low single-digit percentage range, and revenue and operating-expense fluctuations are expected to remain below 1%.`,

  // 8.1.9 — Climate risk and resilience — Climate scenario analysis
  '8.1.9': `We assessed the resilience of our strategy by analyzing potential climate-related financial effects on the value of our assets (property, plant and equipment, and inventories), as well as on anticipated future revenues and operating expenses. These effects were quantified where scenario data permitted and where uncertainty levels allowed for plausible estimations; we did not quantify areas with a high degree of uncertainty, such as the potential reputational impact of climate litigation.

For physical risks, we assessed the exposure of our operations and key suppliers using IPCC climate scenarios for 2026, 2030 and 2050, reflecting low-, medium- and high-emission pathways. For acute physical risks we modeled flooding, cyclones and droughts, identifying primary exposure at manufacturing sites in Western Europe, Egypt, Japan and Turkey, and certain R&D, office and warehouse sites. For transition risks and opportunities, we used scenarios from the IEA, IPCC and BNEF, assessing carbon-pricing risks, renewable-electricity opportunities, and climate-related shifts in disease patterns that could affect demand for our medicines.`,

  // 8.1.10 — Climate risk and resilience — Management of climate-related risks
  '8.1.10': `As part of our annual ERM process, we performed a qualitative assessment of the risk of the potential inability to meet our climate-related and other commitments. This risk cannot be reliably quantified but could have the potential to result in material negative effects on our reputation, talent recruitment and retention, operations, financial results, access to capital and share price in the long term. Considering recent progress, we believe we are on track to achieve our near- and long-term absolute GHG emission reduction targets.

The management of physical climate risks is integrated into operational risk management for manufacturing and supply chain activities, supported by infrastructure (e.g., shelters, flood defenses) and administrative procedures (e.g., business continuity plans), an active energy management system, and a broad, dual-sourced supply chain. The management of climate transition risks is integrated into our strategic and financial planning processes; we monitor regulatory developments and carbon market trends to anticipate cost impacts and adjust our approach to purchasing carbon removal credits.`,

  // 8.2.1 — Pollution of water — Impacts, risks and opportunities
  '8.2.1': `Pharmaceutical manufacturing poses environmental risks and is therefore highly regulated. However, residual risks remain from the handling and disposal of chemicals and wastewater generated during production and cleaning, as well as from suppliers manufacturing APIs on our behalf. In most regions, regulatory permits do not specifically address the release of pharmaceutical residues to the environment, and we have therefore established internal policies to address this topic. Pharmaceutical residues discharged by patients may also enter wastewater systems and, in some cases, persist through treatment.

Investigation and remediation of contamination at legacy sites is ongoing where required. These programs are conducted under regulator-approved plans, and related obligations are recognized through financial provisions in accordance with applicable accounting standards; timelines and cost estimates may evolve as investigations progress.`,

  // 8.2.2 — Pollution of water — Policies
  '8.2.2': `We have processes and procedures designed to ensure compliance with relevant environmental regulations, compliance obligations and internal requirements. Roles and responsibilities for managing risks and ensuring environmental compliance related to pollution are outlined in our HSE Environmental Compliance Handbook, which is aligned with our HSE Policy. Our approach includes assessing environmental risks of new medicines during R&D, reducing and monitoring pharmaceutical discharges at our own sites, ensuring safe disposal of API-containing waste, and supporting research to improve understanding of the environmental risks of APIs.

Novartis follows a risk-based approach to managing APIs in wastewater. We consider that a manufacturing site satisfies water quality standards if it meets all three levels of our water quality maturity ladder: Level 1 (training and legal compliance), Level 2 (quantification and risk assessments), and Level 3 (risk management aiming to ensure Predicted Environmental Concentrations are below Predicted No Effect Concentrations). Our targets are no water quality impacts from manufacturing effluents by 2025 (own manufacturing sites and high-risk suppliers) and by 2030 (own sites and labs, plus all API suppliers).`,

  // 8.2.3 — Pollution of water — Actions
  '8.2.3': `In 2025, we continued to implement industry best practice on water quality by performing training and monitoring compliance, conducting risk assessments and tracking corrective actions at our own sites and those of suppliers, and monitoring water quality impacts from manufacturing effluents. We engaged with suppliers through technical assessments and workshops, and by conducting supplier reviews to monitor water quality.

As in the prior year, 97% of Novartis manufacturing sites and all high-risk suppliers were able to demonstrate that they meet water quality standards across all three levels of our water quality maturity ladder. Internally, we consider our water quality targets for 2025 to be met. For one Novartis manufacturing site located on a campus owned and operated by another company, we have limited influence over investment decisions for campus infrastructure, and it is currently not feasible for us to upgrade the wastewater treatment infrastructure.`,

  // 9.1.1 — Health and safety in our workforce — Impacts, risks and opportunities
  '9.1.1': `Our employees may be exposed to health and safety hazards across the organization stemming from chemicals, hazardous materials, moving equipment, and driver safety. To minimize risks of injuries, illnesses or fatalities, we have established an internally validated HSE management system that applies to all employees, third-party personnel and contractors working at our sites and travelling for work.

Ensuring high health and safety standards is integral to the way we conduct business, and we have due diligence processes in place to address HSE risks. These standards directly support our business model by fostering a safe work environment that minimizes disruptions.`,

  // 9.1.2 — Health and safety in our workforce — Policies
  '9.1.2': `We are committed to maintaining high standards of occupational health and safety. Our health and safety strategy is based on three principles: promote, protect and prevent. Its implementation is supported by dedicated HSE teams in our Biomedical Research, Development and Operations organizational units.

We have an HSE Policy, governed by the ERC function, requiring all Novartis sites to promote healthy and safe working conditions, comply with all relevant laws and regulations, establish an effective health and safety management system aligned with the principles under ISO 45001, and consider health and safety factors when developing products and processes. The policy is supported by dedicated Health and Safety Guidelines and comprehensive handbooks covering topics such as chemical exposure, radiation safety, driving for work, laboratory safety, and accident prevention and response.`,

  // 9.1.3 — Health and safety in our workforce — Actions
  '9.1.3': `We continued to monitor the effectiveness of our HSE management system during 2025, with each Novartis site conducting an annual self-assessment of its program. We carried out risk assessments across all sites to identify the main health and safety risks, and sites were audited according to a standard cycle that ensures a full HSE compliance audit at least every four years.

In 2025, the implementation of the HSE system was reviewed via our internal controls process, validating coverage of more than 99% of our employees, in line with previous years. The lost-time injury and illness rate for employees declined to 0.12 per 200 000 work hours from 0.13 in the prior year. Although the rate among third-party personnel increased to 0.32 from 0.30, this is largely due to the small population size and the limited number of incidents, which can disproportionately affect the figures.`,

  // 9.2.1 — Working conditions in our value chain — Impacts, risks and opportunities
  '9.2.1': `Respecting the labor rights of employees and of workers in our value chain is central to our broader human rights responsibility and commitments. These include freedom from forced and child labor, fair and safe working conditions, and the right to be treated with dignity.

The greatest risk of adverse impacts relating to working conditions at external partners is associated with facilities management, manufacturing of medicines, transportation and warehousing. These categories potentially involve physically demanding, manual or hazardous work, and there is a general risk that such work may be carried out by contracted and/or migrant workers with limited ability to assert their rights. The risk is further heightened in countries where rule of law, labor protections or enforcement mechanisms are less mature. Key risks include exploitative working conditions, discrimination, wage and benefit shortfalls, excessive working hours, and restrictions on freedom of association.`,

  // 9.2.2 — Working conditions in our value chain — Policies
  '9.2.2': `Our Code of Ethics sets out our global commitment to doing what is right in the area of human rights, and our Human Rights Commitment Statement commits us to uphold internationally recognized human rights throughout our value chain. Our Third Party Code (TPC) defines clear labor rights standards for our external partners, with implementation overseen by our Chief Legal and Compliance Officer, who is also responsible for the Company's human rights program.

In line with the UNGC, UNGPs, ILO and other relevant international standards, the TPC requires external partners to prohibit forced and child labor; protect against discrimination; treat workers with respect and dignity; ensure fair employment practices; ensure wages and benefits meet national minimum or prevailing wage levels (and strongly encourage payment of a living wage); avoid excessive working hours; and allow freedom of association and collective bargaining. We assess and address risks through our EPRM framework and participate in joint research and assessments with peer companies through the PSCI.`,

  // 9.2.3 — Working conditions in our value chain — Actions
  '9.2.3': `We updated our TPC in 2025 to strengthen our human rights commitments and to ensure further alignment with the ILO's standards. We delivered targeted training sessions to external partners based on the findings of a pilot program that engaged directly with almost 7 000 supply chain workers through a digital "workers voice" platform, and we have been developing action plans with external partners to address the issues identified.

We continued to implement our Labor Rights 2.0 initiative, launched in 2024, updating our labor rights Third Party Questionnaire, developing corresponding guidance available in 11 languages, and introducing an updated labor rights risk matrix. In 2025, 191 remediation actions related to human and labor rights were initiated with external partners; the decline from the prior year was due to fewer legacy supplier assessments and onsite audits. At the end of the period, 10% of remediation actions were overdue, 2 ppts lower than the prior year, and we did not identify any case of child labor among external partners that have contractual relationships with us.`,

  // 9.3.1 — Patient health and safety — Impacts, risks and opportunities
  '9.3.1': `The development and manufacturing of our products is complex, and deviations, manufacturing process failures, or undetected quality defects in pharmaceutical products could compromise patient health and safety. Our medicines may also have adverse effects on patients, both during clinical trials and after registration.

Failure to ensure quality and safety may lead to product recalls, financial penalties, litigation and regulatory action, harming the Company's financial performance and reputation. Adverse health effects, recalls and penalties can occur in the short term, while other impacts can extend over the long term. We apply our own quality and safety controls to Novartis-owned facilities and to those operated by suppliers and other business partners on our behalf, conducting quality audits as part of our Quality Management System (QMS).`,

  // 9.3.2 — Patient health and safety — Policies
  '9.3.2': `We prioritize safety and quality throughout a medicine's life cycle — from clinical trials and manufacturing to patient use — to minimize risks to patient health and to meet regulatory requirements and internal standards. Our QMS complies with requirements from health authorities and other regulators, and we hold relevant ISO (e.g., ISO 9001, ISO 13485) and Good Practice (GMP, GLP, GCP) certificates. Our clinical operations and manufacturing sites are subject to frequent inspections by health authorities, including the FDA, EMA and Swissmedic.

We monitor the safety of our medicines during development and in the commercial setting through pharmacovigilance, investigating all reports of quality defects and safety issues and sharing periodic safety reports with relevant health authorities. Under our TPC, manufacturing suppliers must possess GMP certificates. Employees and third-party personnel working at our manufacturing sites take part in comprehensive product and patient safety training, which is audited by both our internal audit team and external authorities.`,

  // 9.3.3 — Patient health and safety — Actions
  '9.3.3': `In 2025, we recalled batches of seven products that failed to meet either a required quality or process compliance standard. We had no Class I recalls and three Class II recalls — two affecting one country each and one affecting eight countries — due to an incorrectly printed blister foil, a failed process verification step and an impurity that did not meet specifications. Corrective and preventive actions are in place or in progress to prevent recurrence, and none of the recalls resulted in safety issues for patients.

Our sites were subject to 140 inspections by health authorities in 2025, including the FDA, EMA, Swissmedic and other local authorities, all of which were found to be acceptable. We continued to deploy new technologies, such as artificial intelligence, to simplify processes and generate new insights to further improve patient health and safety.`,

  // 9.4.1 — Access to medicines — Impacts, risks and opportunities
  '9.4.1': `We aim to register our innovative treatments across different geographies to improve access to medicines and health outcomes for patients. Worldwide, millions of people still lack access to basic healthcare and medicines due to factors ranging from aging populations and poverty to inadequate healthcare infrastructure and workforce shortages. Many of these challenges are particularly relevant in high-burden disease areas, such as oncology and cardiovascular diseases.

Addressing these issues requires more than innovative treatments: governments, payers, NGOs and community organizations must share responsibility for developing the policies, infrastructure and partnerships needed to ensure timely access. Barriers to access can also arise during the process of registering and distributing medicines globally, as the preparation and approval of a registration dossier can take months or years, with further delays while price or reimbursement levels are negotiated. Failure to tackle these challenges collectively risks delaying access for patients and impacting public trust, reputation and business sustainability.`,

  // 9.4.2 — Access to medicines — Policies
  '9.4.2': `Our access policies are designed to ensure we do our part to address availability, affordability and equity in healthcare, while recognizing that meaningful progress requires collaboration across the entire healthcare ecosystem. We integrate access considerations into the various stages of our work, from research and development to distribution and pricing strategies, and we implement global access strategies for all new medicines launched. Our approach is overseen by the Board's GSNC and is an integral part of our social impact and sustainability strategy.

Our approach rests on needs-based R&D, where we assess our portfolio against the needs of underserved populations and prioritize diverse patient representation in clinical trials; healthcare systems readiness, where we collaborate with partners on scalable solutions to lower access barriers; affordability, where we take a value-based approach that ties price to outcomes for patients and society; and intellectual property, where we support strong rules for IP protection that promote innovation while addressing healthcare needs.`,

  // 9.4.3 — Access to medicines — Actions
  '9.4.3': `Our medicines are sold in 118 countries worldwide. In 2025, we reached 304 million patients with medicines registered and commercialized by Novartis globally, including established medicines. We are strengthening our approach to access by focusing on strategies that enable timely patient access and measurable health outcomes, starting with high-burden disease areas such as oncology and cardiovascular disease.

In 2025, we introduced several innovative treatments with a strategy to enable broad patient access, including Rhapsido (remibrutinib) for chronic spontaneous urticaria, Vanrafia (atrasentan) for IgA nephropathy, oral Fabhalta (iptacopan) for C3 glomerulopathy, and Kisqali (ribociclib) for high-risk early breast cancer. To further address overlooked and underserved populations, we launched a new social impact and sustainability strategy and are piloting inclusive health accelerators, having completed research and design for the US where we plan to launch them in 2026.`,

  // 9.5.1 — Responsible marketing — Impacts, risks and opportunities
  '9.5.1': `We sell our medicines primarily to drug wholesalers, retailers, private health systems, government agencies, managed care providers, pharmacy benefit managers and government-supported healthcare systems. Our sales representatives present the therapeutic benefits and risks of our products to physicians, pharmacists, hospitals, insurance groups, managed care organizations and other healthcare professionals.

There is a risk that governance of such interactions may be inadequate or fail, or that we may undertake activities based on improper or inadequate scientific justification. These potential impacts are concentrated in commercial operations and third-party value chains, including distributors and sales representatives. Irresponsible marketing practices may compromise public trust, harm patients, damage our reputation and result in fines, penalties or other losses. We are committed to conducting business ethically and with integrity, including the responsible marketing of our treatments.`,

  // 9.5.2 — Responsible marketing — Policies
  '9.5.2': `We have controls and policies designed to ensure we adhere to all relevant laws and industry regulations covering all aspects of a drug's commercialization, including marketing. Our Doing Business Ethically Policy sets out principles for interactions with patients, customers and other third parties, reinforcing commitments in the Novartis Code of Ethics: that all information shared is accurate, clear, fair, balanced, truthful and not misleading; that products are promoted in line with the approved label and only once marketing authorization has been received; that promotional information can be substantiated; and that all pricing and marketing discussions are truthful, accurate and transparent.

We provide employees with our Medical Interaction Global Guidelines and our Policy on the Creation and Approval of Promotional and Non-Promotional Content, and have clear rules for avoiding conflicts of interest. In addition to internal standards, Novartis adheres to recognized industry codes, including those published by PhRMA, IFPMA and EFPIA.`,

  // 9.5.3 — Responsible marketing — Actions
  '9.5.3': `In 2025, there was an increase in the number of substantiated higher-risk allegations of misconduct relating to professional practices compared with the prior year. The increase is related to enhanced internal monitoring efforts. Substantiation of an allegation indicates a breach of our Doing Business Ethically Policy, but does not necessarily imply a violation of law or regulation.

For information on ongoing significant legal proceedings relating to responsible marketing, and for more information on marketing, see the relevant notes and risk-factor disclosures in our Annual Report.`,

  // 10.1 — Business conduct — Impacts, risks and opportunities
  '10.1': `We interact with a range of stakeholders while negotiating contracts, seeking regulatory approval for our drugs, and presenting the therapeutic benefits and risks of our products. These interactions with public officials, healthcare professionals, healthcare organizations, suppliers, customers and others may be vulnerable to undue influence, including bribery, corruption and anti-competitive practices.

Failure to comply with anti-corruption, anti-bribery and antitrust regulations may result in damage to our reputation, legal proceedings, fines and exclusion from markets. These risks can materialize in the short, medium and long term, and are highest in countries with complex or less mature regulatory environments, or inadequate law enforcement. Our interactions are governed by our Code of Ethics and anti-corruption and anti-bribery policies, with mandatory training for all employees, and exposure elsewhere in our value chain is addressed by our EPRM framework and an anti-bribery auditing team within our ERC function.`,

  // 10.2 — Business conduct — Policies
  '10.2': `We work to maintain an ethical business culture, which reduces risk to our business, bolsters relations with partners, and strengthens compliance with laws and regulations. Our policies and programs are built around international standards, including the UN Convention Against Corruption and the OECD Convention on Combating Bribery of Foreign Public Officials, and we are signatories to the UNGC.

All our employees across all Novartis entities undergo mandatory training on our Code of Ethics, which sets out our zero-tolerance approach to bribery, corruption and undue influence. The Code is supported by internal policies including a Conflicts of Interest Policy, Trade Sanctions and Export Controls Guideline, Anti-Fraud Policy, Antitrust and Fair Competition Policy, SpeakUp Policy, Non-Retaliation Policy, and Ethical Use of Data and Technology Policy. Anti-bribery and fair competition risks are also addressed in our Third Party Code, supported by an Anti-Bribery External Partner Guideline and anti-bribery audits of selected external partners.`,

  // 10.3 — Business conduct — Actions
  '10.3': `In 2025, the annual Code of Ethics training achieved a completion rate of 98%, in line with the previous year. Among the allegations made through our grievance mechanism, none of those considered higher risk that related to bribery and kickbacks were substantiated in 2025.

Alongside our internal management framework, we work with external initiatives to help promote ethical standards throughout business and industry, including the UNGC's Call to Action, the World Economic Forum's Partnering Against Corruption initiative, the OECD's Compliance Without Borders program, and the Anti-Corruption Leaders Hub. For information on ongoing significant legal proceedings relating to business conduct, see the relevant notes in our Annual Report.`,

  // 14.1 — Human Rights Statement — Our commitment
  '14.1': `To mitigate negative impacts on human rights throughout our value chain, we conduct ongoing human rights due diligence and have policies and management systems in place. These support our commitment to respecting human rights as articulated in our Human Rights Commitment Statement, in line with the principles set out in the UNGPs and the OECD Guidelines for Multinational Enterprises. Our commitment includes internationally recognized human rights, including those in the International Bill of Human Rights and the ILO's core labor rights conventions.

We strictly prohibit any violation of human rights, including child labor, modern slavery, forced labor and human trafficking. We have global policies and standards that are regularly updated and binding on all our employees globally, including our Code of Ethics, our Human Rights Commitment Statement, and our Third Party Code. We are also signatories to the United Nations Global Compact and report annually on our progress.`,

  // 14.2 — Human Rights Statement — Governance of human rights
  '14.2': `Overall executive-level accountability for implementation of our human rights program sits with the Chief Legal and Compliance Officer, in cooperation with the ESG Committee, led by our CEO. A dedicated Human Rights team within the global ERC function is responsible for implementation of the Novartis human rights strategy.

This Statement is made in accordance with Australia's Modern Slavery Act 2018, Canada's Fighting Against Forced Labour and Child Labour in Supply Chains Act 2023, the UK's Modern Slavery Act 2015, the Norwegian Transparency Act, and the Swiss Ordinance on Due Diligence and Transparency in relation to conflict minerals and child labour. The content was reviewed by local legal teams in each reporting jurisdiction, our Chief Legal and Compliance Officer, and our CEO, before approval by local country heads for signature.`,

  // 14.3 — Human Rights Statement — Salient human rights issues
  '14.3': `Using the risk-saliency principles set out by the UNGPs, we conduct an annual human rights risk assessment to identify and prioritize the most severe potential impacts on people across our value chain. We evaluate and rank risks through stakeholder interviews, evidence reviews and a cross-functional workshop, and monitor actual or suspected breaches via our grievance mechanism, which is also open to our external partners.

Our 2025 assessment reaffirmed our existing human rights priorities, which include labor rights risks in the value chain and health risks related to our core business activities. It also confirmed a low risk of modern slavery and child labor in our operations, based on assessments of business units and high-risk markets identified through our human rights country risk tool, which draws on 15 public human rights indices.`,

  // 14.4 — Human Rights Statement — Human rights due diligence
  '14.4': `As part of our broader commitment to upholding human rights, we proactively assess labor rights risks, including modern slavery, forced labor and child labor, in our supply chain through our External Partner Risk Management (EPRM) framework, and screen all external partners for negative media coverage. We assign external partners a high, medium or low labor rights risk rating, based on country labor rights and procurement category risk ratings.

Procurement risks are determined through ongoing monitoring of supplier activities, while country risks are identified through our human rights country risk tool. Medium- and high-risk external partners undergo enhanced due diligence, which may include a Labor Rights Third Party Questionnaire and on-site audits, followed by remediation and monitoring. Our due diligence is aligned with the OECD Due Diligence Guidance, and effectiveness is assessed through supplier-audit coverage, remediation completion rates and grievance-mechanism outcomes.`,

  // 14.5 — Human Rights Statement — Child labour
  '14.5': `We have processes in place to comply with our obligations under the Swiss Code of Obligations regarding child labour. Our Third Party Code prohibits child labour in all forms, in line with the ILO Minimum Age Convention (no. 138) and the Worst Forms of Child Labour Convention (no. 182).

Risk assessments targeting child labour are conducted for high-risk supplier categories and geographies through our EPRM framework and our human rights country risk tool. In 2025, we did not identify any case of child labor among external partners that have contractual relationships with us. Where risks are identified, we work with external partners on remediation and, where necessary, reassess or terminate the relationship.`,

  // 14.6 — Human Rights Statement — Forced labour and modern slavery
  '14.6': `Our approach to preventing forced labour and modern slavery is integrated into the EPRM framework and Third Party Code, which prohibit forced and child labour, including modern slavery, and require external partners to ensure fair employment practices and freedom of association. High-risk suppliers undergo enhanced due diligence and, where required, on-site audits.

This Statement is intended to satisfy modern-slavery statement obligations across the jurisdictions in which Novartis operates. In 2025, our human rights risk assessment confirmed a low risk of modern slavery and forced labor in our operations, and none of the higher-risk allegations relating to human and labor rights made through our grievance mechanism were substantiated.`,

  // 14.7 — Human Rights Statement — Reporting under jurisdictional acts
  '14.7': `This Statement is made to satisfy reporting obligations under Australia's Modern Slavery Act 2018, Canada's Fighting Against Forced Labour and Child Labour in Supply Chains Act, the UK's Modern Slavery Act 2015, the Norwegian Transparency Act, and the Swiss Due Diligence Ordinance. It covers the reporting period January 1 to December 31, 2025, and, unless expressly stated otherwise, references to "we," "us" and "our" refer to Novartis as a whole, including the applicable reporting entities and their owned and controlled entities.

In preparing this Statement, we worked with multiple global and local teams to gather the required information, and the content was reviewed by local legal teams in each reporting jurisdiction. In Australia, we consulted members of the local executive committee and key supporting functions; compliance of Novartis Norge AS with the Transparency Act is overseen by the local Board of Directors. On December 31, 2025, our reporting entities employed 310 employees in Australia, 523 in Canada, 1 345 in the UK, and 76 in Norway.`,
};
