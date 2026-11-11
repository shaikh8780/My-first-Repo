// ESG Index — the Novartis ESG Index maintained in the Disclosure Studio.
//
// Per Adrian's brief (customer-inputs/ESG-Index-source-links_REFERENCE.md): the
// ESG Index is NOT a metrics table. It is the collection of Novartis's ESG
// website content, maintained going forward inside the Studio. Each topic carries
// its own narrative (the content), an optional pointer to the ESG Data Summary
// (where the underlying metrics live) and a "Relevant links" list of real
// novartis.com pages and PDFs.
//
// Structure follows the body headings of Adrian's Word doc (authoritative where
// the "In this section:" summary line disagreed): 5 categories, 37 topics.
// Governance keeps all 10 body headings (incl. "Business ethics").
//
// Metrics themselves live in the ESG Data Summary 2025 (a separate publication):
// we point to it rather than restating figures here (decision 2026-09-01).

const PDF = 'https://www.novartis.com/sites/novartis_com/files/';

export interface EsgLink {
  label: string;
  url?: string; // absent → rendered as a plain reference
}

export interface EsgIndexTopic {
  ref: string;
  title: string;
  narrative: string;
  // Content of the "See ESG Data Summary 2025 for metrics including: …" pointer.
  dataSummaryMetrics?: string;
  links: EsgLink[];
}

export interface EsgIndexCategory {
  ref: string;
  title: string;
  intro: string;
  topics: EsgIndexTopic[];
}

// Publications the ESG Index points to (intro block).
export const esgIndexIntro = {
  lead:
    'Novartis welcomes interest from investors and other stakeholders concerned with environmental, social and governance (ESG) topics. This ESG Index shows where disclosures on key topics can be found across our publications and website.',
  body:
    'Please also visit the ESG and ESG rating performance web pages as well as the Reporting and transparency hub to access the Report on Nonfinancial Matters 2025, the Update on Public Commitments 2025, the ESG Data Summary 2025 and other relevant publications.',
  publications: [
    { label: 'ESG', url: 'https://www.novartis.com/esg' },
    { label: 'ESG rating performance', url: 'https://www.novartis.com/investors/reporting-and-transparency-hub/esg-rating-performance' },
    { label: 'Reporting and transparency hub', url: 'https://www.novartis.com/investors/reporting-and-transparency-hub' },
    { label: 'Report on Nonfinancial Matters 2025 (PDF 1.0 MB)', url: `${PDF}novartis-report-nonfinancial-matters-2025.pdf` },
    { label: 'Update on Public Commitments 2025 (PDF 0.1 MB)', url: `${PDF}novartis-update-public-commitments-2025.pdf` },
    { label: 'ESG Data Summary 2025 (PDF 0.1 MB)', url: `${PDF}novartis-esg-data-summary-2025.pdf` },
  ] as EsgLink[],
};

// The ESG Data Summary is referenced 22+ times as the metric source. One link.
export const esgDataSummaryUrl = `${PDF}novartis-esg-data-summary-2025.pdf`;

export const esgIndexCategories: EsgIndexCategory[] = [
  {
    ref: 'ENV',
    title: 'Environment',
    intro:
      'Our commitment to environmental sustainability is an important part of how we build trust with society and is aligned with our purpose. Unless we can operate sustainably, our efforts to improve and extend people’s lives may be compromised by our environmental impact. Our Environmental Sustainability Strategy lays out our priorities in this area.',
    topics: [
      {
        ref: 'ENV1',
        title: 'Climate',
        narrative:
          'Novartis is committed to using resources efficiently and reducing greenhouse gas (GHG) emissions. In July 2024, the Science Based Targets initiative (SBTi) validated the near- and long-term, science-based emissions reduction targets of Novartis, aiming for net-zero carbon emissions by 2040. Our strategy is consistent with limiting global warming to 1.5°C above pre-industrial levels, and hence in line with the goals of the Paris Agreement.',
        dataSummaryMetrics: 'energy; GHG emissions; removals and carbon credits; transition planning',
        links: [
          { label: 'Climate', url: 'https://www.novartis.com/esg/environmental-sustainability/climate' },
          { label: 'Environmental Sustainability Criteria for Suppliers (PDF 0.2 MB)', url: `${PDF}novartis-environmental-sustainability-criteria-for-suppliers.pdf` },
        ],
      },
      {
        ref: 'ENV2',
        title: 'Nature – Water',
        narrative:
          'Responsible water management means using water efficiently and safely throughout the life cycle of our products, across our operations and supply chain. We have processes and procedures designed to ensure compliance with relevant environmental regulations, compliance obligations and internal requirements. We are committed to having no water quality impacts from manufacturing effluents from our own manufacturing sites and labs, as well as from high-risk suppliers and suppliers of active pharmaceutical ingredients (API). By 2030, we also plan to implement water use reductions for own and supplier sites based in water-stressed basins that have potential material impacts on these basins. Sites are identified through our nature assessment, which follows the Taskforce on Nature-related Financial Disclosures (TNFD) framework and guidance by the Science Based Targets Network (SBTN).',
        dataSummaryMetrics: 'water withdrawals; water discharged; water consumption; sites and suppliers meeting water quality standards',
        links: [
          { label: 'Nature - Water', url: 'https://www.novartis.com/esg/environmental-sustainability/water' },
          { label: 'Environmental Sustainability Criteria for Suppliers (PDF 0.2 MB)', url: `${PDF}novartis-environmental-sustainability-criteria-for-suppliers.pdf` },
          { label: 'Position on Pharmaceuticals in the Environment (PDF 0.2 MB)', url: `${PDF}pharmaceuticals-environment.pdf` },
        ],
      },
      {
        ref: 'ENV3',
        title: 'Nature – Waste',
        narrative:
          'Our waste management strategy aims to prevent, reduce, reuse, recycle or recover waste (including energy recovery), before selecting safe disposal as an option. Waste prevention and reduction are always preferred to treatment, incineration or disposal. We have targets to reduce the amount of non-hazardous and hazardous operational waste sent to disposal. We ensure the secure collection and treatment of waste containing active pharmaceutical ingredients (APIs), and we encourage patients to dispose of any unused or expired products or waste materials in accordance with applicable legal and regulatory requirements.',
        dataSummaryMetrics: 'waste generated; waste recycled; waste not recycled; non-hazardous waste; hazardous waste; sites that have eliminated PVC in product packaging',
        links: [
          { label: 'Nature - Waste', url: 'https://www.novartis.com/esg/environmental-sustainability/waste' },
          { label: 'Environmental Sustainability Criteria for Suppliers (PDF 0.2 MB)', url: `${PDF}novartis-environmental-sustainability-criteria-for-suppliers.pdf` },
          { label: 'Position on Pharmaceuticals in the Environment (PDF 0.2 MB)', url: `${PDF}pharmaceuticals-environment.pdf` },
        ],
      },
      {
        ref: 'ENV4',
        title: 'Pollution of air',
        narrative:
          'We disclose our emissions of volatile organic compounds (VOCs) annually. Our SOx and NOx emissions have relatively low impact, and we expect further decreases through climate and emissions mitigation initiatives, such as energy-efficient building projects, technological and process improvements to reduce energy use, and adopting renewable energy to reduce fossil fuel reliance.',
        dataSummaryMetrics: 'volatile organic compounds',
        links: [
          { label: 'Health, Safety and Environment Policy (PDF 0.4 MB)', url: `${PDF}health-safety-environment-policy.pdf` },
        ],
      },
      {
        ref: 'ENV5',
        title: 'Environmental management',
        narrative:
          'Novartis has an internal health, safety and environment (HSE) management system that applies to all employees. We are committed to regularly conducting audits, reviews and self-inspections to ensure conformance to internal requirements, as well as compliance with applicable local laws and regulations. The sites that have chosen to pursue external HSE management system certifications (Eco-Management and Audit Scheme (EMAS), ISO 14001, ISO 45001 and/or ISO 50001) have gone above and beyond our internal expectations. Novartis supports individual site decisions on pursuing external certifications.',
        dataSummaryMetrics: 'coverage of internally validated HSE system; coverage of certified environmental management system (ISO 14001 or EMAS)',
        links: [
          { label: 'Health, Safety and Environment Policy (PDF 0.4 MB)', url: `${PDF}health-safety-environment-policy.pdf` },
        ],
      },
      {
        ref: 'ENV6',
        title: 'Sustainable product design',
        narrative:
          'The design, development and delivery of more sustainable products for our patients are key enablers of our environmental sustainability strategy. Our strategic priority to develop sustainable products for our patients covers a holistic review of the drug development life cycle, from early-stage research and product development and commercialization to the use and disposal of our products by patients and medical staff. Environmental life cycle assessments (LCAs) provide the framework to first evaluate the environmental impacts associated with our products, processes and activities over their entire life cycle. Once evaluated, we apply circular-economy principles to identify and implement opportunities to reduce our impact. This ranges from the selection of raw materials and application of a more sustainable product design approach, through to the collection and recycling of products at end-of-life, where appropriate.',
        links: [
          { label: 'Environmental Sustainability Strategy (PDF 2.2 MB)', url: `${PDF}novartis-environmental-sustainability-strategy.pdf` },
          { label: 'Case study: Breezhaler® Carbon Footprint', url: 'https://www.novartis.com/esg/environmental-sustainability/climate/case-study-breezhaler-carbon-footprint' },
        ],
      },
    ],
  },
  {
    ref: 'PPL',
    title: 'People',
    intro:
      'The success of our business depends on our ability to attract, grow and retain talented individuals who understand the diverse perspectives of our customers, patients and other stakeholders. We strive to cultivate a company culture where our people are inspired by our purpose, curious about new ideas for better patient outcomes, empowered to be their best, accountable (unbossed) to deliver our strategy, and committed to operating with integrity to build trust with society.',
    topics: [
      {
        ref: 'PPL1',
        title: 'Human capital policies',
        narrative:
          'Novartis recognizes and commits to respect every employee’s right to freedom of opinion, expression and speech, consistent with our policies and standards of respectful behavior. We value an open and fair workplace and are committed to cultivating an environment where everyone feels comfortable expressing opinions and contributing ideas. We communicate with transparency, and our employees can make appropriate use of suitable systems for direct communication, including social media. We measure employee engagement every quarter through a voluntary and anonymous survey. It is sent to all employees and carried out by an external vendor to ensure independence. Aggregated results are used to identify potential risks and make improvements to working conditions, training and development, access to support programs and other areas where necessary.',
        links: [
          { label: 'People and Culture', url: 'https://www.novartis.com/about/people-and-culture' },
          { label: 'People & Organization Commitment Statement (PDF 0.7 MB)', url: `${PDF}people-organization-commitment-statement.pdf` },
          { label: 'Code of Ethics (PDF 2.2 MB)', url: `${PDF}code-of-ethics-english.pdf` },
          { label: 'Handling complaints: Novartis SpeakUp', url: 'https://www.novartis.com/esg/ethics-risk-and-compliance/ethical-behavior/speakup' },
        ],
      },
      {
        ref: 'PPL2',
        title: 'Learning and development',
        narrative:
          'We invest in the development and training of our people, offering access to business-critical, personal and professional development training. We place emphasis on continuous learning, career development and employees taking full ownership of their growth, guided by their manager and supported through enterprise tools and solutions. Employees can use internal AI-based platforms to manage how they learn, find new roles, and develop their skills and experiences through new projects, job rotations, mentoring, or volunteering. We develop our leaders based on their needs and role, through training programs and on-demand measures, such as individual coaching and team effectiveness resources. Our approach to managing performance includes frequent check-ins between managers and employees on goals, career development, feedback and wellbeing. Employees are required to complete ethics, risk and compliance (ERC) training. Our global e-training curriculum provides relevant information to enable employees to make the right choices in the course of their work and to perform with integrity.',
        dataSummaryMetrics: 'training hours per employee',
        links: [
          { label: 'Life handbook (PDF 4.5 MB)', url: `${PDF}novartis-life-handbook.pdf` },
          { label: 'Career programs', url: 'https://www.novartis.com/careers' },
          { label: 'Students', url: 'https://www.novartis.com/careers/early-careers/students' },
          { label: 'Graduates', url: 'https://www.novartis.com/careers/early-careers/graduates' },
          { label: 'ERC learning and engagement', url: 'https://www.novartis.com/esg/ethics-risk-and-compliance/learning-and-engagement' },
        ],
      },
      {
        ref: 'PPL3',
        title: 'Equal pay and benefits',
        narrative:
          'Pay equity (i.e., paying employees fairly for similar work based solely on job-related factors) is a fundamental principle of our employment policies, reflecting a commitment in our Code of Ethics to treat all employees fairly and respectfully. We offer a range of competitive local and global benefits. Our local Novartis retirement, health and welfare plans protect employees against the financial consequences of disability or death and provide attractive retirement benefits aligned with local social security requirements. We provide a flexible, hybrid work environment that allows employees to balance their professional and personal responsibilities. Parental leave is available to all permanent employees regardless of gender or sexual orientation. New parents get a minimum of 14 weeks paid leave following the birth or adoption of a child.',
        dataSummaryMetrics: 'pay equity; mean pay gap',
        links: [
          { label: 'People & Organization Commitment Statement (PDF 0.7 MB)', url: `${PDF}people-organization-commitment-statement.pdf` },
          { label: 'Life handbook (PDF 4.5 MB)', url: `${PDF}novartis-life-handbook.pdf` },
        ],
      },
      {
        ref: 'PPL4',
        title: 'Health and safety',
        narrative:
          'We have an internal health, safety and environment (HSE) management system that requires the implementation across our sites of strict health and safety controls that go beyond legal minimum requirements. Some manufacturing sites have also chosen to pursue external HSE management system certifications (ISO 14001, 45001 and/or 50001). Novartis runs a comprehensive HSE audit and controls program across all operations to assess compliance with legal and company standards. The program includes topic-specific assessments such as process safety, industrial hygiene and contractor safety. Every site must complete an annual HSE controls self-assessment, with a sample reviewed annually by an independent internal controls review team. Handling chemical and biological materials is an integral and essential part of research, development and manufacturing programs at Novartis. Our biosafety program sets out standards, tools and practices for employees to manage potential risks when handling biological materials. Novartis also supports the goals and objectives of the Biological and Toxin Weapons Convention (BTWC).',
        dataSummaryMetrics: 'lost-time injury and illness rate; total recordable case rate; fatalities; coverage of internally validated HSE system; coverage of certified health and safety management system (OHSAS 18001 or ISO 45001)',
        links: [
          { label: 'Health, Safety and Environment Policy (PDF 0.4 MB)', url: `${PDF}health-safety-environment-policy.pdf` },
          { label: 'Biological and Toxin Weapons Convention', url: 'https://disarmament.unoda.org/biological-weapons/' },
        ],
      },
      {
        ref: 'PPL5',
        title: 'Wellbeing and mental health',
        narrative:
          'We offer support and learning tools to help employees care for themselves and others by prioritizing their mental health and wellbeing. Through global and local campaigns and engagement activities, we build awareness and destigmatize the conversation around mental health. We maintain a Wellbeing Index, based on our quarterly employee engagement survey, which monitors perceptions of work-life balance and our commitment to wellbeing. This data is used to customize our mental health and wellbeing offerings. For example, we have a training program for mental health first aiders, who are equipped with the skills and confidence to have supportive confidential conversations with coworkers and peers, and guide them to the appropriate professional support if needed.',
        links: [
          { label: 'People & Organization Commitment Statement (PDF 0.7 MB)', url: `${PDF}people-organization-commitment-statement.pdf` },
          { label: 'Life handbook (PDF 4.5 MB)', url: `${PDF}novartis-life-handbook.pdf` },
        ],
      },
      {
        ref: 'PPL6',
        title: 'Inclusion',
        narrative:
          'We focus on creating a work environment in which all our people feel they belong. We believe it promotes innovation as well as understanding for the diverse perspectives of our customers, patients and other stakeholders. Equal opportunity is an important part of our Culture & People Experience strategy. This is exemplified by our renewed Equal Pay International Coalition pledge, with three commitments to achieve by 2027: remain committed to maintain gender representation in management; to review our human resources practices beyond base pay to eliminate any further potential sources of bias in accordance with applicable law; and to make the requirements of the new EU Pay Transparency Directive our global minimum standard for internal pay equity and pay transparency reporting.',
        dataSummaryMetrics: 'gender representation; pay equity; pay transparency; mean pay gap',
        links: [
          { label: 'Inclusion strategy', url: 'https://www.novartis.com/about/inclusion' },
          { label: 'People & Organization Commitment Statement (PDF 0.7 MB)', url: `${PDF}people-organization-commitment-statement.pdf` },
          { label: 'Global Non-Discrimination, Non-Harassment and Civility Policy (PDF 0.2 MB)', url: `${PDF}novartis-global-non-discrimination-non-harassment-and-non-retaliation-guideline.pdf` },
        ],
      },
      {
        ref: 'PPL7',
        title: 'Human Rights',
        narrative:
          'Novartis is committed to conducting business in a manner that respects the rights and dignity of all people that may be affected by our business activities. We adopted our first Human Rights Commitment Statement in 2003, and we continue to make progress in expanding our efforts to respect human rights within our operations and throughout our supply chain. To mitigate negative impacts on human rights throughout our value chain, we conduct ongoing human rights due diligence and have policies and management systems in place. We have four human rights priorities, reviewed each year through an internal cross-functional human rights risk saliency exercise: Right to health; Labor rights; Environment; and Technology (responsible use of personal information and ethical use of AI).',
        dataSummaryMetrics: 'human and labor rights remediation actions with external partners',
        links: [
          { label: 'Human Rights Commitment Statement (PDF 0.3 MB)', url: `${PDF}novartis-human-rights-commitment-statement.pdf` },
          { label: 'Human Rights', url: 'https://www.novartis.com/esg/ethics-risk-and-compliance/human-rights' },
          { label: 'Code of Ethics (PDF 2.2 MB)', url: `${PDF}code-of-ethics-english.pdf` },
          { label: 'Third Party Code (PDF 0.4 MB)', url: `${PDF}novartis-third-party-code-v-4.pdf` },
          { label: 'Global Non-Discrimination, Non-Harassment and Civility Policy (PDF 0.2 MB)', url: `${PDF}novartis-global-non-discrimination-non-harassment-and-non-retaliation-guideline.pdf` },
        ],
      },
      {
        ref: 'PPL8',
        title: 'Living wage',
        narrative:
          'Novartis is committed to paying employees a living wage that meets or exceeds the amount for basic living needs, in line with our UN Global Compact commitment. Living wages are updated annually adjusting for changes in inflation, food prices and other market conditions. Each year, we review and adjust salaries that fall below the living wage level. The scope of the living-wage review includes all countries where we have our own employees (applying to permanent and temporary employees in countries with at least one permanent headcount).',
        dataSummaryMetrics: 'coverage of living wage review; cases of employee wages below agreed living wage benchmark',
        links: [
          { label: 'People & Organization Commitment Statement (PDF 0.7 MB)', url: `${PDF}people-organization-commitment-statement.pdf` },
        ],
      },
      {
        ref: 'PPL9',
        title: 'Freedom of association and collective bargaining',
        narrative:
          'Novartis upholds the right of employees to freedom of association and encourages open communication and direct engagement to resolve workplace and compensation issues, without threat of intimidation or retaliation. Employees have the right to bargain collectively. Where collective agreements are in place, they are communicated to all employees in a language they can understand. Worker representatives are granted reasonable time and access to facilities and communication tools to carry out their role, in accordance with local laws. Novartis requires its third parties to apply the same approach, in line with expectations set out in the Novartis Third Party Code.',
        dataSummaryMetrics: 'coverage of employee representative body or collective bargaining agreement',
        links: [
          { label: 'People & Organization Commitment Statement (PDF 0.7 MB)', url: `${PDF}people-organization-commitment-statement.pdf` },
          { label: 'Human Rights Commitment Statement (PDF 0.3 MB)', url: `${PDF}novartis-human-rights-commitment-statement.pdf` },
          { label: 'Third Party Code (PDF 0.4 MB)', url: `${PDF}novartis-third-party-code-v-4.pdf` },
        ],
      },
      {
        ref: 'PPL10',
        title: 'Philanthropy and community investment',
        narrative:
          'Novartis works through its institutional business and strategic partnerships to address access gaps for neglected and infectious diseases (e.g., leprosy) and to expand the availability of our medicines in low-income settings. In addition to donations, we leverage supply programs with global health organizations such as the World Health Organization (WHO) and the Global Fund to ensure sustainable access. All product donations comply with the WHO Checklist and the WHO Guidelines for Medicine Donations. Through the Novartis Foundation, we improve population health and equity through AI and multisector collaboration. Through employee giving with company matching, community initiatives and our skills-based volunteering program, our people can support partner organizations across several causes and beneficiary areas.',
        links: [
          { label: 'Donation programs', url: 'https://www.novartis.com/esg/access/donations' },
          { label: 'Novartis Foundation', url: 'https://www.novartisfoundation.org/' },
          { label: 'External Funding', url: 'https://www.novartis.com/healthcare-professionals/novartis-external-funding' },
          { label: 'Giving, Matching & Volunteering' },
        ],
      },
    ],
  },
  {
    ref: 'INA',
    title: 'Innovation and access',
    intro:
      'Our R&D teams are dedicated to discovering and developing new treatments for diseases including cancer, heart disease and neurological and immunological conditions. We aim to register our innovative treatments across different geographies to improve access to medicines and health outcomes for patients.',
    topics: [
      {
        ref: 'INA1',
        title: 'Commitment to patients and caregivers',
        narrative:
          'Novartis works with the patient community around the world to discover new ways to improve and extend people’s lives. The four pillars of our commitment to patients and caregivers are: respecting and understanding the patient community perspective; expanding access to our medicines; conducting responsible clinical trials; and recognizing the importance of transparency and reporting.',
        links: [
          { label: 'Novartis commitment to patients and caregivers', url: 'https://www.novartis.com/patients-and-caregivers/novartis-commitment-patients-and-caregivers' },
          { label: 'Access', url: 'https://www.novartis.com/esg/access' },
          { label: 'Clinical trials', url: 'https://www.novartis.com/clinicaltrials' },
          { label: 'Patients and Caregivers', url: 'https://www.novartis.com/clinicaltrials/patients-and-caregivers' },
          { label: 'Position on Collaborating with Patient Organizations (PDF 0.2 MB)', url: `${PDF}novartis-position-on-collaborating-with-patient-organizations.pdf` },
        ],
      },
      {
        ref: 'INA2',
        title: 'Access Principles',
        narrative:
          'Improving access to medicines remains one of the world’s greatest healthcare challenges. Through the Novartis Access Principles, we seek to expand access to our medicines to underserved patient populations across high-income and low- and middle-income countries. For all our medicines, we aim to implement access strategies based on three principles: Research and development (assessing our R&D portfolio against the unmet needs of underserved populations); Affordability and pricing (a value-based approach tying the price of a medicine to outcomes, plus patient support and managed access programs); and Health systems strengthening (long-term investments in healthcare infrastructure in collaboration with governments and partners). To reinforce our commitment in low- and middle-income countries, we issued a EUR 1.85 billion sustainability-linked bond (SLB) in 2020 and report on progress in the Update on Public Commitments.',
        dataSummaryMetrics: 'patients reached; new medicines launched with a global access strategy; projects in research and development; submissions; approvals; countries with products sold',
        links: [
          { label: 'Novartis access principles', url: 'https://www.novartis.com/esg/access/novartis-access-principles' },
          { label: 'Position on Access to Medicines (PDF 0.2 MB)', url: `${PDF}access-to-healthcare-perspective.pdf` },
          { label: 'Access to Medicine 2024 Novartis Report Card', url: 'https://accesstomedicinefoundation.org/company/novartis-ag' },
          { label: 'Research & Development', url: 'https://www.novartis.com/esg/access/novartis-access-principles/research-development' },
          { label: 'Patents and Licensing', url: 'https://www.novartis.com/esg/access/patents-and-licensing' },
          { label: 'Position on Post-Trial Access (PDF 0.2 MB)', url: `${PDF}novartis-position-on-post-trial-access.pdf` },
          { label: 'Position on Medicines for Patients with Rare Diseases (PDF 0.1 MB)', url: `${PDF}medicines-for-patients-with-rare-diseases.pdf` },
          { label: 'Position on Access to Unauthorized Products through MAPs (PDF 0.2 MB)', url: `${PDF}novartis-position-unauthorized-products-access.pdf` },
          { label: 'Affordability', url: 'https://www.novartis.com/esg/access/novartis-access-principles/affordability' },
          { label: 'Position on value-based healthcare (PDF 0.2 MB)', url: `${PDF}novartis-position-on-value-based-healthcare.pdf` },
          { label: 'Creating sustainable business models', url: 'https://www.novartis.com/esg/access/creating-sustainable-business-models' },
          { label: 'Health system strengthening framework', url: 'https://www.novartis.com/esg/access/novartis-access-principles/strengthening-healthcare-systems' },
        ],
      },
      {
        ref: 'INA3',
        title: 'Global health and neglected diseases',
        narrative:
          'Our work on global health is aligned with our overall efforts to expand access to our medicines. We follow an integrated approach for the control or elimination of neglected diseases where there has been market failure and little investment in research and development such as malaria, leprosy, dengue, leishmaniasis, Chagas disease and sickle cell disease. In 2022, Novartis endorsed the Kigali Declaration on neglected tropical diseases (NTDs) and announced a five-year financial commitment of USD 250 million to the fight against NTDs and malaria.',
        dataSummaryMetrics: 'patients reached; investment in R&D for malaria and neglected tropical diseases; countries with community health initiatives launched',
        links: [
          { label: 'Global Health', url: 'https://www.novartis.com/esg/global-health' },
          { label: 'Sickle cell disease', url: 'https://www.novartis.com/diseases/sickle-cell-disease' },
          { label: 'Chagas disease', url: 'https://www.novartis.com/diseases/chagas-disease' },
          { label: 'Malaria', url: 'https://www.novartis.com/diseases/malaria' },
          { label: 'Leprosy', url: 'https://www.novartis.com/diseases/leprosy' },
          { label: 'Other neglected and infectious diseases', url: 'https://www.novartis.com/research-and-development/research-disease-areas/global-health-disease-area-research-novartis' },
          { label: 'Novartis Foundation', url: 'https://www.novartisfoundation.org/' },
        ],
      },
      {
        ref: 'INA4',
        title: 'Clinical trials',
        narrative:
          'Clinical trials are at the heart of our work to bring innovative medicines to people with a particular disease or condition. These studies ensure that an investigative medicine is effective and safe, and rely entirely on patients and healthy volunteers. For every Novartis clinical trial our primary responsibility is to protect the safety, wellbeing and legal rights of all participants, and ensure adherence to the highest ethical standards for clinical research.',
        links: [
          { label: 'Clinical trials', url: 'https://www.novartis.com/clinicaltrials' },
          { label: 'Clinical Trials Results', url: 'https://www.novoctrd.com/' },
          { label: 'Commitment to patients and caregivers', url: 'https://www.novartis.com/patients-and-caregivers/novartis-commitment-patients-and-caregivers' },
          { label: 'Clinical Study Transparency (PDF 0.2 MB)', url: `${PDF}clinical-trial-data-transparency.pdf` },
          { label: 'Commitment to Diversity in Clinical Trials (PDF 0.1 MB)', url: `${PDF}commitment-for-diversity-in-clinical-trials.pdf` },
          { label: 'Position on Investigator Initiated Trials (PDF 0.2 MB)', url: `${PDF}novartis-investigator-initiated-trials.pdf` },
          { label: 'Position on Responsible Clinical Trials (PDF 0.2 MB)', url: `${PDF}novartis-position-on-responsible-clinical-trials.pdf` },
          { label: 'Ethics in Clinical Trials', url: 'https://www.novartis.com/clinicaltrials/ethics-clinical-trials' },
          { label: 'Position on Scientific Publications (PDF 0.2 MB)', url: `${PDF}position-on-scientific-publications.pdf` },
        ],
      },
      {
        ref: 'INA5',
        title: 'Animal welfare',
        narrative:
          'Often, animal studies are required by regulatory agencies around the world to better understand complex disease mechanisms and to prove that medicines are safe and effective. Our animal research is governed by our Animal Welfare Policy, which applies to all Novartis-sponsored studies, whether internal or external. The policy commits us to applying the 3Rs principles — to replace animals with other methods where possible; to reduce the number of animals needed in our studies; and to refine study methods to improve animals’ experience. We have a grant program to prospectively fund 3Rs research projects.',
        dataSummaryMetrics: 'animal research',
        links: [
          { label: 'Animal Research', url: 'https://www.novartis.com/investors/reporting-and-transparency-hub/animal-research' },
          { label: 'Animal Welfare Policy (PDF 0.3 MB)', url: `${PDF}novartis-global-animal-welfare-policy.pdf` },
          { label: 'Position on animal research (PDF 0.2 MB)', url: `${PDF}animal-research.pdf` },
        ],
      },
      {
        ref: 'INA6',
        title: 'Intellectual Property',
        narrative:
          'Our approach to intellectual property (IP) derives from our broader purpose to reimagine medicine to improve and extend people’s lives. We use patents and other IP rights as a means to enable the discovery and development of breakthrough medical innovations, to facilitate their delivery to the patients who need them, and to promote scientific and technological progress. Novartis does not seek or enforce patents in least developed countries (LDCs), low-income countries (LICs), or in around 80% of the lower-middle income countries (LMICs). In the small number of LMICs where we do seek or enforce patents, we aim to limit them to patent applications covering new molecular entities, and we are committed to granting nonexclusive licenses to qualified third parties for supply of our patented products exclusively to LDCs or LICs.',
        links: [
          { label: 'Patents and licensing', url: 'https://www.novartis.com/esg/access/patents-and-licensing' },
          { label: 'Position on Intellectual Property (PDF 0.3 MB)', url: `${PDF}novartis-intellectual-property-position.pdf` },
          { label: 'Position on regulatory data protection (PDF 0.2 MB)', url: `${PDF}regulatory-data-protection.pdf` },
        ],
      },
    ],
  },
  {
    ref: 'QAS',
    title: 'Quality and supply',
    intro:
      'We prioritize quality and safety at each stage of a medicine’s life cycle. During clinical trials and after launch, we monitor the use of our medicines to identify possible adverse events and minimize risks to patients. In the production phase, we ensure product quality from raw material sampling and testing to packaging, testing and distribution of finished goods. We are also committed to timely identification, authentication and reporting of falsified medicines, and to engaging with third parties who operate in a manner consistent with our values and ethical principles.',
    topics: [
      {
        ref: 'QAS1',
        title: 'Product quality',
        narrative:
          'To ensure product quality, we maintain a robust quality management system for our medicines in full compliance with requirements from health authorities and other regulators. We have licenses and relevant ISO and Good Practice (GxP) certificates for all our activities, including clinical trials, manufacturing, medical devices, supply, warehouse and distribution operations. Our facilities are regularly subject to inspections from health authorities and other regulators. Employees and third-party personnel working in our facilities take part in comprehensive quality and safety training before executing a GxP relevant task.',
        dataSummaryMetrics: 'GxP audits; inspections; recalls; coverage of certified quality management system',
        links: [
          { label: 'Quality', url: 'https://www.novartis.com/about/quality' },
          { label: 'Quality Policy (PDF 0.2 MB)', url: `${PDF}novartis-quality-commitment.pdf` },
        ],
      },
      {
        ref: 'QAS2',
        title: 'Pharmacovigilance',
        narrative:
          'Pharmacovigilance involves monitoring the safety of medicines. Our approach to achieve effective pharmacovigilance relies on safety monitoring both during drug development and in the commercial setting, as well as the timely assessment and reporting of adverse events.',
        links: [
          { label: 'Reporting side effects for Novartis products', url: 'https://www.novartis.com/healthcare-professionals' },
        ],
      },
      {
        ref: 'QAS3',
        title: 'Falsified medicines',
        narrative:
          'Falsified medicines pose significant health risks and are a growing global health problem. Our efforts to combat falsified medicines are focused on investigating all incidents and mitigating risks across four distinct areas: counterfeiting, illegal diversion, product theft and tampering. Our strategy is focused on accelerating the timely authentication and reporting of falsified medicines by leveraging the latest innovative technologies. We have also strengthened our supply chain security capabilities and governance, and continuously work with public and private stakeholders to encourage collective enforcement, advocacy, policy and coordinated action.',
        links: [
          { label: 'Position on Falsified and Counterfeit Medical Product (PDF 0.2 MB)', url: `${PDF}falsified-counterfeit-medical-products-07-2019.pdf` },
        ],
      },
      {
        ref: 'QAS4',
        title: 'External Partner Risk Management (EPRM)',
        narrative:
          'We are committed to working with third parties who operate in a manner that is consistent with our values and ethical principles. While interactions with third parties at Novartis are broadly defined by our Third-Party Code, we identify, assess, monitor and mitigate risk associated with suppliers through our External Partner Risk Management (EPRM) framework. Our EPRM process promotes ethical behavior and fosters sustainability across our supply chain by addressing risk areas such as anti-bribery; labor rights; global trade sanctions; information security; data privacy; animal welfare; health, safety and environment (HSE); contractor safety; substances of concern in products; business continuity management; and raw material certification.',
        dataSummaryMetrics: 'external partners audited; external partner engagements stopped; human and labor rights remediation actions with external partners',
        links: [
          { label: 'External Partner Risk Management (EPRM)', url: 'https://www.novartis.com/esg/ethics-risk-and-compliance/integrated-risk-assurance/external-partner-risk-management-eprm' },
          { label: 'Third Party Code (PDF 0.4 MB)', url: `${PDF}novartis-third-party-code-v-4.pdf` },
          { label: 'Environmental Sustainability Criteria for Suppliers (PDF 0.2 MB)', url: `${PDF}novartis-environmental-sustainability-criteria-for-suppliers.pdf` },
          { label: 'Privacy Notice for Third Parties', url: 'https://www.novartis.com/privacy/general-privacy-notice-third-parties' },
        ],
      },
      {
        ref: 'QAS5',
        title: 'Responsible promotion and marketing of products',
        narrative:
          'We have controls and policies designed to ensure we adhere to all relevant laws and industry regulations. These cover all aspects of a drug’s commercialization, including marketing. Our Doing Business Ethically Policy sets out principles for interactions with patients, customers and other third parties where there is potential risk, for example, of unethical business practice or inappropriate influence. This policy reinforces commitments outlined in the Novartis Code of Ethics. The process requirements for engagement activities with external stakeholders have been embedded within our BeSure digital compliance platform, and we have established a comprehensive monitoring and audit framework.',
        links: [
          { label: 'Doing Business Ethically policy (PDF 0.4 MB)', url: `${PDF}doing-business-ethically-policy.pdf` },
          { label: 'Conflict of Interest Guideline (PDF 0.3 MB)', url: `${PDF}conflict-of-interest-guideline.pdf` },
          { label: 'Interactions with Healthcare professionals', url: 'https://www.novartis.com/healthcare-professionals' },
          { label: 'Payments to Healthcare Professionals', url: 'https://www.novartis.com/investors/reporting-and-transparency-hub/payments-healthcare-professionals' },
          { label: 'Patient Organization Funding', url: 'https://www.novartis.com/investors/reporting-and-transparency-hub/patient-organization-funding' },
        ],
      },
    ],
  },
  {
    ref: 'GOV',
    title: 'Governance',
    intro:
      'Strong governance supports the effective management of our business and is the basis of trust in our company. Our corporate governance framework — along with our internal controls and policies — is intended to support sustainable financial performance and long-term value creation for shareholders, patients, employees and other stakeholders.',
    topics: [
      {
        ref: 'GOV1',
        title: 'Corporate governance',
        narrative:
          'Novartis is committed to good corporate governance. Our principles and rules on corporate governance are laid down in the Articles of Incorporation and the Organizational Regulations of Novartis AG. The Governance, Sustainability and Nomination Committee reviews these principles and rules periodically considering prevailing best practices and forwards suggestions for improvement to the full Board for approval.',
        links: [
          { label: 'Corporate governance', url: 'https://www.novartis.com/investors/company-overview/corporate-governance' },
          { label: 'General Meetings', url: 'https://www.novartis.com/investors/shareholder-information/general-meetings' },
        ],
      },
      {
        ref: 'GOV2',
        title: 'Board and executive remuneration',
        narrative:
          'At Novartis, our compensation system seeks to reward our executives for delivering sustainable growth, successful outcomes on our financial and strategic targets, and value creation for our shareholders. We aim to be transparent in how we link executive compensation to performance, and continue to engage with shareholders and proxy advisors in this effort.',
        links: [
          { label: 'Annual Report (PDF 3.1 MB)', url: `${PDF}novartis-annual-report-2025.pdf` },
        ],
      },
      {
        ref: 'GOV3',
        title: 'Business ethics',
        narrative:
          'Our Code of Ethics sets out our basic commitments to ethical business conduct. Our Doing Business Ethically policy reinforces our commitment to maintain high standards of ethical business conduct and to not tolerate any form of bribery or corruption. The external partner risk is governed by our External Partner Risk Management guidelines and Doing Business Ethically policy. Our SpeakUp Office investigates allegations of misconduct. The design and execution of activities related to our ethical standards are continually audited as part of our annual Internal Audit engagements.',
        dataSummaryMetrics: 'Code of Ethics training; anti-bribery training',
        links: [
          { label: 'Code of Ethics (PDF 2.2 MB)', url: `${PDF}code-of-ethics-english.pdf` },
          { label: 'Doing Business Ethically (PDF 0.4 MB)', url: `${PDF}doing-business-ethically-policy.pdf` },
          { label: 'Anti-Bribery Report', url: 'https://www.novartis.com/esg/ethics-risk-and-compliance/compliance/anti-bribery-report' },
          { label: 'Third Party Code (PDF 0.4 MB)', url: `${PDF}novartis-third-party-code-v-4.pdf` },
          { label: 'Conflicts of Interest Guideline (PDF 0.3 MB)', url: `${PDF}conflict-of-interest-guideline.pdf` },
        ],
      },
      {
        ref: 'GOV4',
        title: 'Grievance mechanism',
        narrative:
          'The Novartis SpeakUp grievance mechanism enables internal and external stakeholders to report allegations of misconduct related to company operations or its supply chain. Allegations can be submitted anonymously. The mechanism is designed to protect those who use it in good faith against retaliation and maintains confidentiality throughout the reporting and investigation process.',
        dataSummaryMetrics: 'allegations; dismissals and resignations related to higher-risk misconduct cases',
        links: [
          { label: 'Handling complaints: Novartis SpeakUp', url: 'https://www.novartis.com/esg/ethics-risk-and-compliance/ethical-behavior/speakup' },
          { label: 'Human rights', url: 'https://www.novartis.com/esg/ethics-risk-and-compliance/human-rights' },
          { label: 'Non-Retaliation Policy (PDF 0.3 MB)', url: `${PDF}novartis-non-retaliation-policy.pdf` },
          { label: 'Third Party Code (PDF 0.4 MB)', url: `${PDF}novartis-third-party-code-v-4.pdf` },
        ],
      },
      {
        ref: 'GOV5',
        title: 'Risk management',
        narrative:
          'The Novartis Enterprise Risk Management (ERM) framework is designed to generate a holistic view of risks for the company and drive a culture of smart risk-taking that advances our strategy. While our Code of Ethics sets the ethical framework for all employees to manage risk across our business, risk management is a fundamental leadership responsibility. The Board oversees risk management systems and processes through its Risk Committee. The Executive Committee of Novartis (ECN) fosters a culture of risk awareness, and reviews and validates the annual risk portfolio. The ERM process is the responsibility of the Chief Legal and Compliance Officer.',
        links: [
          { label: 'Annual Report (PDF 3.1 MB)', url: `${PDF}novartis-annual-report-2025.pdf` },
          { label: 'Enterprise risk management', url: 'https://www.novartis.com/esg/ethics-risk-and-compliance/integrated-risk-assurance/enterprise-risk-management' },
          { label: 'External Partner Risk Management (EPRM)', url: 'https://www.novartis.com/esg/ethics-risk-and-compliance/integrated-risk-assurance/external-partner-risk-management-eprm' },
        ],
      },
      {
        ref: 'GOV6',
        title: 'Information security and data privacy',
        narrative:
          'At Novartis, and as reflected in our Code of Ethics, we are committed to the responsible use of personal information in our business processes and the setting of the appropriate standards to achieve this purpose. We have robust governance, policies and systems in place to ensure the security of our data and IT systems, including Board-level oversight of cybersecurity through the Risk Committee, and management-level responsibility through our Chief Information Security Officer (CISO).',
        links: [
          { label: 'Privacy Hub', url: 'https://www.novartis.com/privacy' },
          { label: 'Ethical Use of Data and Technology Policy (PDF 0.3 MB)', url: `${PDF}novartis-ethical-use-of-data-technology-policy.pdf` },
          { label: 'Code of Ethics (PDF 2.2 MB)', url: `${PDF}code-of-ethics-english.pdf` },
          { label: 'Our Commitment to ethical and responsible use of AI', url: 'https://www.novartis.com/esg/ethics-risk-and-compliance/compliance/our-commitment-ethical-and-responsible-use-artificial-intelligence-ai' },
        ],
      },
      {
        ref: 'GOV7',
        title: 'Responsible use of new technologies',
        narrative:
          'Novartis recognizes that new technologies, including artificial intelligence (AI), are crucial for driving innovation and improving patient outcomes. We are committed to the responsible development, deployment and use of AI technologies, ensuring its use aligns with our Code of Ethics and our Data and Technology Policy.',
        links: [
          { label: 'Our Commitment to ethical and responsible use of Artificial Intelligence (AI)', url: 'https://www.novartis.com/esg/ethics-risk-and-compliance/compliance/our-commitment-ethical-and-responsible-use-artificial-intelligence-ai' },
          { label: 'Ethical Use of Data and Technology Policy (PDF 0.3 MB)', url: `${PDF}novartis-ethical-use-of-data-technology-policy.pdf` },
        ],
      },
      {
        ref: 'GOV8',
        title: 'Political engagement',
        narrative:
          'At Novartis, we strive to engage in constructive dialogue with policymakers and other external stakeholders in addressing some of society’s most challenging healthcare issues. Through our activities, we aim to help shape a legislative and regulatory environment that benefits patients and society, improves access to innovative medicines, and supports better health outcomes. We conduct all political engagement activities in a responsible and ethical manner in line with our Code of Ethics, including policy advocacy and engagement with stakeholders at global, regional and local level, participation in trade associations, and appropriately governed and transparent political contributions.',
        dataSummaryMetrics: 'lobbying expenditure; political contributions; membership in trade associations',
        links: [
          { label: 'Public Policy', url: 'https://www.novartis.com/investors/reporting-and-transparency-hub/public-policy' },
          { label: 'Responsible Lobbying Global Guideline (PDF 0.1 MB)', url: `${PDF}novartis-guideline-on-responsible-lobbying.pdf` },
        ],
      },
      {
        ref: 'GOV9',
        title: 'Tax disclosure',
        narrative:
          'Novartis views tax as a core part of our contribution to society. Governance of tax matters is overseen by the Board of Directors. Where appropriate, tax risks are escalated to the Board for review and tax decisions are presented to the Board for endorsement. Novartis prepares a report that details the taxes paid in each country where we operate. This country-by-country report is lodged with the Swiss Tax Authorities and made available to other tax authorities under the protocols for the automatic exchange of tax information.',
        links: [
          { label: 'Tax Policy Statement (PDF 0.2 MB)', url: `${PDF}tax-policy-statement.pdf` },
          { label: 'Annual Report (PDF 3.1 MB)', url: `${PDF}novartis-annual-report-2025.pdf` },
        ],
      },
      {
        ref: 'GOV10',
        title: 'Transparency and disclosures',
        narrative:
          'Transparent reporting and disclosure play a key role in building trust with society. Novartis applies and supports laws and regulations that promote transparency around relationships between healthcare companies and healthcare professionals, healthcare organizations and patient organizations, and related transfers of value. For patient organizations, Novartis goes beyond the reporting requirements set by the EFPIA Code of Practice. In our Reporting and transparency hub, we also share our corporate disclosures, including our Report on Nonfinancial Matters, annual regulatory filings and governance documents such as policies and positions on key issues.',
        links: [
          { label: 'Clinical trial transparency', url: 'https://www.novartis.com/clinicaltrials/transparency' },
          { label: 'Patient organization funding', url: 'https://www.novartis.com/investors/reporting-and-transparency-hub/patient-organization-funding' },
          { label: 'Payments to Healthcare Professionals', url: 'https://www.novartis.com/investors/reporting-and-transparency-hub/payments-healthcare-professionals' },
          { label: 'Reporting and transparency hub', url: 'https://www.novartis.com/investors/reporting-and-transparency-hub' },
          { label: 'Positions on Key Issues', url: 'https://www.novartis.com/node/639256' },
          { label: 'Codes, Policies and Guidelines', url: 'https://www.novartis.com/node/639256' },
        ],
      },
    ],
  },
];

// Flat topic list (used by the report registry + scoped views). ref carries the
// topic code; detail carries the parent category for grouping in list views.
export const esgIndexTopicsFlat = esgIndexCategories.flatMap(cat =>
  cat.topics.map(t => ({ ref: t.ref, title: t.title, detail: cat.title })),
);

export const esgIndexTopicCount = esgIndexTopicsFlat.length; // 37
