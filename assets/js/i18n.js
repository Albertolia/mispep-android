/* ============================================================
   MISPEP INTERNATIONALIZATION (i18n) MODULE
   Español (ES) / English (EN)
   ============================================================ */

(function(window) {
  'use strict';

  var currentLang = localStorage.getItem('mispep_lang') || 'es';

  var categoriesEn = {
    'Metabolismo': 'Metabolism',
    'Reparación': 'Repair',
    'Eje GH': 'GH Axis',
    'Longevidad': 'Longevity',
    'Cognición': 'Cognition',
    'Inmunidad': 'Immunity',
    'Sexual': 'Sexual Health'
  };

  var peptidesEn = {
  "Tirzepatida (Mounjaro / Zepbound)": {
    "desc": "Dual GIP and GLP-1 receptor agonist in a single molecule: 39 amino acids with a C20 fatty diacid moiety attached at Lys20 that reversibly binds to albumin and prolongs its action. Enhances insulin secretion, delays gastric emptying, and reduces appetite and fat mass; reference compound for dual incretin signaling (Coskun, 2018).",
    "contra": "Hypersensitivity; personal/family history of MTC or MEN2 (boxed warning); pregnancy (discontinue prior to planned pregnancy); breastfeeding not recommended.",
    "halfLife": "5 days",
    "freq": "Once weekly (SubQ)"
  },
  "Semaglutida (Ozempic / Wegovy)": {
    "desc": "Acylated GLP-1 analogue of 31 amino acids with a C18 fatty diacid (and Aib at position 8) that binds to albumin for prolonged once-weekly action with selective GLP-1 receptor affinity. Regulates blood glucose and promotes hypothalamic satiety; classic benchmark in incretin pathway research (Lau, 2015).",
    "contra": "Hypersensitivity; personal/family history of MTC or MEN2; pregnancy (discontinue ≥2 months prior to pregnancy); breastfeeding not recommended.",
    "halfLife": "7 days",
    "freq": "Once weekly (SubQ)"
  },
  "Retatrutida (LY3437943)": {
    "desc": "Triple GIP/GLP-1/glucagon receptor agonist in a single 39-amino-acid molecule. In addition to appetite suppression, the glucagon arm increases resting energy expenditure and hepatic lipolysis; landmark molecule for studying simultaneous activation of all three metabolic signaling pathways (Coskun, 2022).",
    "contra": "Not approved for human use (RUO). Hypersensitivity; personal/family history of MTC or MEN2; prior pancreatitis; severe GI disease (gastroparesis/IBD); pregnancy/breastfeeding; <18 years.",
    "halfLife": "6 days",
    "freq": "Once weekly (SubQ)"
  },
  "Cagrilintida (AM833)": {
    "desc": "Long-acting acylated amylin analogue that acts on calcitonin and amylin (AMY) receptors in the area postrema, promoting homeostatic satiety via a non-incretin pathway. In preclinical and clinical synergy with GLP-1 (CagriSema), it reduces food intake and delays gastric emptying through complementary neural mechanisms (Kruse, 2021).",
    "contra": "Not approved for human use (RUO). Hypersensitivity to amylin analogues; severe GI disorders; pancreatitis; pregnancy/breastfeeding; <18 years.",
    "halfLife": "7-8 days",
    "freq": "Once weekly (SubQ)"
  },
  "Survodutida (BI 456906)": {
    "desc": "Dual glucagon and GLP-1 receptor agonist in a single peptide: glucagon activation drives hepatic energy expenditure, lipid oxidation, and anti-fibrotic remodeling in NASH/MASH, while GLP-1 balances glycemic control and suppresses appetite (Zimmermann, 2022).",
    "contra": "Not approved for human use (RUO). Hypersensitivity; personal/family history of MTC or MEN2; decompensated hepatic disease; pancreatitis; pregnancy/breastfeeding; <18 years.",
    "halfLife": "5-6 days",
    "freq": "Once weekly (SubQ)"
  },
  "Mazdutida (IBI362)": {
    "desc": "Dual GLP-1 and glucagon receptor agonist (OXM analogue) modified with a fatty acid side chain for extended half-life. Promotes dual weight reduction and hepatic fat clearance in metabolic syndrome and NAFLD/MASH models (Ji, 2021).",
    "contra": "Not approved for human use (RUO). Hypersensitivity; personal/family history of MTC or MEN2; pancreatitis; pregnancy/breastfeeding; <18 years.",
    "halfLife": "~5 days",
    "freq": "Once weekly (SubQ)"
  },
  "AOD-9604 (Fragmento hGH 176-191)": {
    "desc": "Synthetic 16-amino-acid peptide corresponding to the lipolytic C-terminal domain of human growth hormone (hGH 176-191), stabilized with an internal disulfide bridge. Stimulates lipolysis and inhibits lipogenesis in adipocytes without IGF-1 elevation or hyperglycemic/mitogenic effects (Heffernan, 2001).",
    "contra": "Hypersensitivity; active cancer (precautionary RUO principle); pregnancy/breastfeeding; <18 years.",
    "halfLife": "~30 minutes",
    "freq": "Daily in fasting or before cardio (SubQ)"
  },
  "BPC-157 (Body Protection Compound)": {
    "desc": "Stable gastric pentadecapeptide (15 amino acids, sequence GEPPPGKPADDAGLV) derived from human gastric juice. Promotes collateral angiogenesis through VEGFR2 upregulation, accelerates tendon, ligament, muscle, and bone repair, and exhibits cytoprotective activity across the gastrointestinal tract (Sikiric, 2010).",
    "contra": "Hypersensitivity; active malignancy (due to pro-angiogenic activity); pregnancy/breastfeeding; not approved for human clinical use (RUO).",
    "halfLife": "4-6 hours (tissue biological activity >24h)",
    "freq": "1-2 times daily (SubQ / Oral)"
  },
  "TB-500 (Timosina Beta-4 fragmento)": {
    "desc": "Synthetic peptide derived from the active actin-sequestering domain of Thymosin Beta-4 (LKKTETQ sequence). Regulates actin polymerization (G-actin sequestering), accelerates cell migration, endothelial repair, and dermal wound healing with anti-fibrotic and anti-inflammatory properties (Philp, 2003).",
    "contra": "Hypersensitivity; active malignancy (promotes cell migration/angiogenesis); pregnancy/breastfeeding; RUO (research use only).",
    "halfLife": "24-48 hours",
    "freq": "2 times weekly (SubQ)"
  },
  "KPV (Lys-Pro-Val)": {
    "desc": "C-terminal tripeptide of alpha-melanocyte stimulating hormone (alpha-MSH 11-13). Potent mucosal anti-inflammatory agent that inhibits NF-kB nuclear translocation without triggering melanogenesis. Widely studied in inflammatory bowel disease, colitis, and dermatitis (Catania, 2000).",
    "contra": "Hypersensitivity to MSH peptides; pregnancy/breastfeeding; RUO (research use only).",
    "halfLife": "~2-3 hours",
    "freq": "1-2 times daily (SubQ / Oral / Topical)"
  },
  "ARA-290 (Cibinetida)": {
    "desc": "Synthetic 11-amino-acid peptide designed from the tertiary structure of erythropoietin (EPO helix B) that selectively activates the Innate Repair Receptor (IRR / EPOR-betaCR) without stimulating hematopoiesis or erythropoiesis. Promotes nerve fiber regeneration and provides anti-neuropathic and cytoprotective relief in small fiber neuropathy (Brines, 2008).",
    "contra": "Hypersensitivity; acute systemic infection; pregnancy/breastfeeding; RUO.",
    "halfLife": "~20-30 minutes (tissue receptor activation >24h)",
    "freq": "Daily or every other day (SubQ)"
  },
  "Ipamorelina (Eje GH)": {
    "desc": "Pentapeptide growth hormone secretagogue (GHRP) with exceptional selectivity for the ghrelin/GHS-R1a receptor. Induces pulsatile GH release without significantly elevating ACTH, cortisol, prolactin, or aldosterone, unlike older secretagogues (Raun, 1998).",
    "contra": "Active cancer/malignancy; pituitary tumors; severe hyperglycemia; pregnancy/breastfeeding; RUO.",
    "halfLife": "~2 hours",
    "freq": "1-3 times daily before bed/fasting (SubQ)"
  },
  "CJC-1295 (sin DAC / Mod-GRF 1-29)": {
    "desc": "Tetrasubstituted synthetic analogue of GHRH 1-29 (positions 2, 8, 15, and 27 substituted with D-Ala, Gln, Ala, and Leu) to resist DPP-4 enzymatic degradation. Enhances physiological pulsatile growth hormone secretion when co-administered with a GHRP (Teichman, 2006).",
    "contra": "Active malignancy; proliferative diabetic retinopathy; intracranial lesions; pregnancy/breastfeeding; RUO.",
    "halfLife": "~30 minutes",
    "freq": "1-3 times daily alongside a GHRP (SubQ)"
  },
  "CJC-1295 con DAC (Eje GH)": {
    "desc": "Synthetic GHRH analogue conjugated to a Drug Affinity Complex (DAC) with a maleimidopropionic acid linker that covalently binds to circulating serum albumin (Lys58). Prolongs terminal half-life to ~6-8 days, delivering sustained basal GH and IGF-1 elevations (Jette, 2005).",
    "contra": "Active malignancy; pituitary adenoma; diabetic retinopathy; pregnancy/breastfeeding; RUO.",
    "halfLife": "6-8 days",
    "freq": "1-2 times weekly (SubQ)"
  },
  "Tesamorelina (Egrifta)": {
    "desc": "Stabilized synthetic GHRH analogue consisting of 44 amino acids modified with a trans-3-hexenoic acid group at the N-terminus. Clinically approved for reducing visceral adipose tissue in HIV-associated lipodystrophy; increases basal and pulsatile GH and IGF-1 secretion (Falutz, 2007).",
    "contra": "Hypersensitivity; active cancer; pituitary hypophysectomy or pituitary tumor; pregnancy/breastfeeding.",
    "halfLife": "~26-38 minutes",
    "freq": "Daily at bedtime (SubQ)"
  },
  "Sermorelina (GHRH 1-29)": {
    "desc": "Synthetic peptide representing the fully functional 29-amino-acid N-terminal sequence of native human growth hormone-releasing hormone (GHRH 1-44). Stimulates physiological pituitary somatotroph GH secretion; classic diagnostic and anti-aging research peptide (Walker, 1994).",
    "contra": "Active neoplasm; intracranial hypertension; pregnancy/breastfeeding; untreated hypothyroidism.",
    "halfLife": "~10-12 minutes",
    "freq": "Daily before sleep (SubQ)"
  },
  "GHRP-2 (Pralmorelina)": {
    "desc": "Synthetic hexapeptide growth hormone secretagogue (D-Ala-D-betaNal-Ala-Trp-D-Phe-Lys-NH2) that strongly activates the ghrelin GHS-R1a receptor. Induces potent GH release with moderate appetite stimulation and mild, dose-dependent increases in prolactin and cortisol (Bowers, 1992).",
    "contra": "Active neoplasm; pituitary adenoma; uncontrolled diabetes; pregnancy/breastfeeding; RUO.",
    "halfLife": "~30-60 minutes",
    "freq": "1-3 times daily (SubQ)"
  },
  "Hexarelina (Eje GH)": {
    "desc": "Potent synthetic hexapeptide secretagogue of the GHRP class. Produces the highest acute GH peak per mcg dose, but causes receptor desensitization over prolonged continuous use and mildly elevates prolactin and cortisol; also exhibits cardioprotective CD36 receptor binding (Locatelli, 2000).",
    "contra": "Active malignancy; cardiac arrhythmia; pregnancy/breastfeeding; requires cycling (e.g. 4-8 weeks on, 4 weeks off); RUO.",
    "halfLife": "~70 minutes",
    "freq": "1-2 times daily in cycles (SubQ)"
  },
  "Epitalon (Epitalamina)": {
    "desc": "Synthetic tetrapeptide (Ala-Glu-Asp-Gly / AEDG) based on bovine pineal extract (epithalamin). Stimulates pineal melatonin synthesis and upregulates telomerase activity and telomere elongation in somatic cells, extending cellular lifespan in aging models (Khavinson, 2003).",
    "contra": "Hypersensitivity; active cancer/malignancy (due to telomerase activation); pregnancy/breastfeeding; RUO.",
    "halfLife": "Short (hours in plasma, biological regulatory effects persist for weeks)",
    "freq": "10-20 day cycle 1-2 times per year (SubQ)"
  },
  "GHK-Cu (Péptido de Cobre)": {
    "desc": "Naturally occurring human plasma tripeptide (Gly-His-Lys) with high-affinity copper(II) chelation. Modulates gene expression of over 4,000 genes, stimulates collagen, elastin, and glycosaminoglycan synthesis, accelerates dermal and capillary remodeling, and demonstrates antioxidant and anti-inflammatory properties (Pickart, 2008).",
    "contra": "Hypersensitivity to copper complexes; Wilson's disease or copper metabolism disorders; pregnancy/breastfeeding; RUO.",
    "halfLife": "~1-3 hours (biological matrix effects persist for days)",
    "freq": "Daily or 3-5 times weekly in cycles (SubQ / Topical)"
  },
  "MOTS-c (Péptido Mitocondrial)": {
    "desc": "Mitochondrial-derived 16-amino-acid peptide encoded in the 12S rRNA region of mtDNA. Acts as a metabolic hormone by activating AMPK, improving cellular glucose uptake, enhancing fatty acid oxidation, and reversing age-associated insulin resistance (Lee, 2015).",
    "contra": "Hypersensitivity; severe hypoglycemia; pregnancy/breastfeeding; RUO.",
    "halfLife": "~4-6 hours",
    "freq": "3 times weekly (e.g. Mon-Wed-Fri) (SubQ)"
  },
  "SS-31 (Elamipretida / Bendavia)": {
    "desc": "Mitochondria-targeted synthetic tetrapeptide (D-Arg-Dmt-Lys-Phe-NH2) that selectively binds to cardiolipin in the inner mitochondrial membrane. Optimizes electron transport chain function, prevents cardiolipin peroxidation, reduces reactive oxygen species (ROS) leakage, and restores ATP production in aging cardiac, renal, and skeletal muscle tissues (Szeto, 2014).",
    "contra": "Hypersensitivity; severe acute renal/hepatic failure; pregnancy/breastfeeding; RUO.",
    "halfLife": "~2-4 hours",
    "freq": "Daily (SubQ)"
  },
  "Humanina": {
    "desc": "Endogenous 24-amino-acid mitochondrial-derived peptide that binds to the tripartite receptor (gp130/WSX-1/CNTFR) and protects cells against apoptotic death, oxidative stress, and beta-amyloid neurotoxicity; reference regulator of cellular resilience and mitochondrial longevity (Hashimoto, 2001).",
    "contra": "Hypersensitivity; active malignancy; pregnancy/breastfeeding; RUO.",
    "halfLife": "Short (~30-60 minutes in circulation)",
    "freq": "1-2 times weekly in cycles (SubQ)"
  },
  "NAD+ (Nicotinamida Adenina Dinucleótido)": {
    "desc": "Essential cellular coenzyme (dinucleotide) required for oxidoreductase reactions, ATP generation in the mitochondrial Krebs cycle, and as an obligate substrate for PARP DNA repair enzymes and sirtuins (SIRT1-7). Depleted with aging; systemic administration supports metabolic and cognitive revitalization (Rajman, 2018).",
    "contra": "Hypersensitivity; acute heart disease; active malignancy (tumor cell metabolic dependency); pregnancy/breastfeeding.",
    "halfLife": "Rapid systemic clearance / cellular uptake (~15-30 min)",
    "freq": "1-3 times weekly (SubQ / IM / IV)"
  },
  "Glutatión (GSH)": {
    "desc": "Endogenous tripeptide (gamma-L-glutamyl-L-cysteinylglycine) serving as the body's primary intracellular antioxidant. Neutralizes free radicals, regenerates vitamins C and E, and acts as a key cofactor for glutathione S-transferase in hepatic phase II detoxification and immune cell maintenance (Forman, 2009).",
    "contra": "Hypersensitivity; sulfite sensitivity; active asthma; pregnancy/breastfeeding.",
    "halfLife": "~10-15 minutes (intracellular pool lasts hours/days)",
    "freq": "1-3 times weekly (SubQ / IM / IV)"
  },
  "Semax (Heptapéptido ACTH 4-10)": {
    "desc": "Synthetic heptapeptide derived from the ACTH 4-10 sequence modified with a C-terminal Pro-Gly-Pro tripeptide (Met-Glu-His-Phe-Pro-Gly-Pro) to resist proteolytic degradation. Increases BDNF and TrkB expression, promotes neuroprotection, enhances attention and working memory, and accelerates post-ischemic recovery without hormonal corticotropic activity (Ashmarin, 1997).",
    "contra": "Hypersensitivity; acute psychotic disorders; severe anxiety or agitation; pregnancy/breastfeeding; RUO outside licensed clinical regions.",
    "halfLife": "~2-4 hours (neurotrophic gene expression induction >20h)",
    "freq": "1-2 times daily (Intranasal / SubQ)"
  },
  "Selank (Tuftsina sintética)": {
    "desc": "Synthetic heptapeptide based on the endogenous immunomodulatory peptide tuftsin, stabilized with a Pro-Gly-Pro sequence (Thr-Lys-Pro-Arg-Pro-Gly-Pro). Acts as a potent anxiolytic and cognitive enhancer by modulating GABAergic transmission and dopamine/serotonin turnover without sedation, dependence, or muscle relaxation (Uchakin, 2007).",
    "contra": "Hypersensitivity; severe depressive states with motor inhibition; pregnancy/breastfeeding; RUO outside licensed countries.",
    "halfLife": "~2-4 hours",
    "freq": "1-2 times daily (Intranasal / SubQ)"
  },
  "Dihexa (N-hexanoic-Tyr-Ile)": {
    "desc": "Synthetic oligopeptide-derived small molecule derived from angiotensin IV that binds with high affinity to hepatocyte growth factor (HGF) and potentiates c-Met receptor dimerization. Induces massive spinogenesis and synaptogenesis at picomolar concentrations in hippocampal and cortical neurons; benchmark in neurodegenerative research (McCoy, 2013).",
    "contra": "Active malignancy or cancer history (potent c-Met pro-mitogenic signaling); pregnancy/breastfeeding; RUO (research use only).",
    "halfLife": "~12-14 days (extended tissue stability)",
    "freq": "1-2 times weekly (Oral / SubQ)"
  },
  "Oxitocina (Cognición)": {
    "desc": "Endogenous nonapeptide neurohormone synthesized in the hypothalamus. Regulates social bonding, empathy, stress reduction, and maternal behavior, while attenuating amygdala hyperactivity to social fear stimuli (Meyer-Lindenberg, 2011).",
    "contra": "Hypersensitivity; pregnancy (induces uterine contractions); cardiovascular disease; concurrent vasopressor therapy.",
    "halfLife": "~3-5 minutes (behavioral effects persist 1-3h)",
    "freq": "As needed (Intranasal / SubQ)"
  },
  "Timosina Alfa-1 (Ta1 / Zadaxin)": {
    "desc": "Synthetic 28-amino-acid peptide derived from prothymosin alpha. Master immunomodulator that stimulates T-cell differentiation, enhances natural killer (NK) cell activity, upregulates MHC class I presentation, and activates Toll-like receptors (TLR9), restoring immune balance without triggering inflammatory cytokine storms (Goldstein, 1977).",
    "contra": "Hypersensitivity; organ transplant recipients (prevention of allograft rejection); active autoimmune flares; pregnancy/breastfeeding.",
    "halfLife": "~2 hours (immune signaling cascade persists >24h)",
    "freq": "2 times weekly (SubQ)"
  },
  "LL-37 (Catelicidina)": {
    "desc": "Human cathelicidin-derived 37-amino-acid antimicrobial peptide. Disrupts microbial cell membranes, neutralizes lipopolysaccharides (LPS), promotes re-epithelialization and wound healing, and recruits immune cells to infection sites (Dürr, 2006).",
    "contra": "Hypersensitivity; autoimmune disease with psoriasis or rosacea (may exacerbate); active inflammatory bowel disease; RUO.",
    "halfLife": "~1-2 hours",
    "freq": "Daily or alternate days in short cycles (SubQ / Topical)"
  },
  "PT-141 (Bremelanotida / Vyleesi)": {
    "desc": "Synthetic cyclic heptapeptide analogue of alpha-MSH that acts as a non-selective agonist of melanocortin receptors (MC3R and MC4R) in the central nervous system. Stimulates sexual desire and arousal through central dopaminergic and melanocortinergic pathways rather than vascular dilation; approved for premenopausal HSDD (Kingsberg, 2019).",
    "contra": "Uncontrolled hypertension; cardiovascular disease; pregnancy/breastfeeding; concurrent naltrexone therapy; hypersensitivity.",
    "halfLife": "~2.7 hours",
    "freq": "As needed, 45 min before activity (SubQ)"
  },
  "Melanotan II (MT-2)": {
    "desc": "Cyclic lactam synthetic peptide analogue of alpha-MSH that acts non-selectively across MC1R, MC3R, MC4R, and MC5R. Stimulates melanogenesis (skin pigmentation/tanning) via MC1R and central libido via MC4R, but causes nausea, facial flushing, and blood pressure increases (Dorr, 1996).",
    "contra": "Melanoma or dysplastic nevi history; uncontrolled hypertension; cardiac arrhythmia; pregnancy/breastfeeding; RUO.",
    "halfLife": "~1-2 hours (melanin deposition persists for weeks)",
    "freq": "Daily microdoses in titration cycles (SubQ)"
  },
  "Kisspeptina-10 (Sexual)": {
    "desc": "Decapeptide representing the active C-terminal fragment of kisspeptin-54. Binds to GPR54 (KISS1R) in the hypothalamus, triggering pulsatile GnRH release and downstream LH and FSH secretion from the anterior pituitary, regulating the gonadal-hypothalamic axis and testosterone production (Dhillo, 2005).",
    "contra": "Hormone-sensitive tumors (prostate cancer, breast cancer); pregnancy/breastfeeding; RUO.",
    "halfLife": "~28 minutes",
    "freq": "1-3 times weekly (SubQ)"
  },
  "Wolverine (BPC-157 + TB-500)": {
    "desc": "Synergistic dual peptide blend combining BPC-157 and TB-500. Unites BPC-157's VEGFR2-driven angiogenesis and gastrointestinal/tendon cytoprotection with TB-500's G-actin-mediated cell migration and anti-fibrotic remodeling, accelerating systemic musculoskeletal recovery.",
    "contra": "Active malignancy or history of cancer (dual pro-angiogenic and migratory stimulation); pregnancy/breastfeeding; RUO.",
    "halfLife": "BPC: ~4h | TB-500: ~24h",
    "freq": "1-2 times daily (SubQ)"
  },
  "Klow (GHK-Cu + TB-500 + BPC-157 + KPV)": {
    "desc": "Quadruple repair blend combining GHK-Cu, TB-500, BPC-157, and KPV. Concurrently targets extracellular matrix remodeling, actin-driven cell migration, collateral microvascular angiogenesis, and NF-kB mucosal anti-inflammatory suppression across damaged connective tissues.",
    "contra": "Active malignancy; Wilson's disease or copper disorders; pregnancy/breastfeeding; RUO.",
    "halfLife": "BPC: ~4h | TB: ~24h | KPV: ~2h | GHK: ~2h",
    "freq": "Daily or alternate days in cycles (SubQ)"
  },
  "Glow (BPC-157 + TB-500 + GHK-Cu)": {
    "desc": "Triple regenerative stack comprising BPC-157, TB-500, and GHK-Cu. Synergistically promotes microvascular angiogenesis, collagen/elastin extracellular matrix synthesis, and cellular motility, widely researched for accelerated tissue and dermal repair.",
    "contra": "Active malignancy; copper storage disorders; pregnancy/breastfeeding; RUO.",
    "halfLife": "BPC: ~4h | TB: ~24h | GHK: ~2h",
    "freq": "Daily or alternate days in cycles (SubQ)"
  },
  "CJC-1295 + Ipamorelina (stack GHRH + GHRP)": {
    "desc": "Gold standard GH secretagogue stack combining a GHRH analogue (Mod-GRF 1-29) and a selective ghrelin receptor agonist (Ipamorelina). Synergistically amplifies pulsatile pituitary growth hormone release without elevating cortisol or prolactin.",
    "contra": "Active cancer/malignancy; pituitary tumors; severe hyperglycemia; pregnancy/breastfeeding; RUO.",
    "halfLife": "Ipamorelina: ~2h | Mod-GRF: ~30 min",
    "freq": "1-2 times daily before sleep/fasting (SubQ)"
  },
  "IGF-1 LR3 (Eje GH)": {
    "desc": "Recombinant 83-amino-acid analogue of human IGF-1 incorporating an Arg substitution at position 3 and a 13-amino-acid N-terminal extension. Drastically decreases binding to inhibitory IGFBPs (IGF binding proteins), resulting in a 20-30x prolonged half-life and potent systemic anabolic and myoblast-proliferating activity (Tomas, 1993).",
    "contra": "Active cancer or family history of malignancy (potent mitogenic/anti-apoptotic signaling); severe hypoglycemia; diabetic retinopathy; RUO.",
    "halfLife": "~20-24 hours",
    "freq": "Post-workout or morning (SubQ)"
  },
  "DSIP (Péptido inductor del sueño delta)": {
    "desc": "Endogenous nonapeptide (Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu) discovered in rabbit cerebral venous blood during slow-wave sleep. Modulates sleep architecture by enhancing delta/SWS rhythms, reducing hypothalamic stress responses, and stabilizing circadian rhythms (Schoenenberger, 1977).",
    "contra": "Hypersensitivity; concurrent sedative/hypnotic medications without medical oversight; pregnancy/breastfeeding; RUO.",
    "halfLife": "~15-30 minutes (circadian sleep modulation persists overnight)",
    "freq": "30-60 min before sleep (SubQ)"
  },
  "5-Amino-1MQ (Metabolismo)": {
    "desc": "Small-molecule nicotinamide derivative (NO es un péptido) that acts as a selective, membrane-permeable inhibitor of nicotinamide N-methyltransferase (NNMT). Upregulates intracellular NAD+ levels and SAM/SAH flux, reverses adipocyte hypertrophy, and promotes energy expenditure without altering food intake (Neelakantan, 2018).",
    "contra": "Hypersensitivity; renal or hepatic impairment; active cancer (NNMT dynamics in oncology); pregnancy/breastfeeding; RUO.",
    "halfLife": "~6-8 hours",
    "freq": "Daily in fasting or with meals (Oral / SubQ)"
  },
  "SLU-PP-332 (Metabolismo)": {
    "desc": "Small-molecule acylhydrazone (NOT a peptide) that acts as a pan-agonist of estrogen-related receptors (ERR alpha, beta, and gamma). Triggers gene expression programs of aerobic exercise, mitochondrial biogenesis, and fatty acid oxidation. In sedentary mice, it increased treadmill running endurance by ~70% (Billon, 2023). Unapproved for human use: typical research reference 5 mg/day s.c. or 25 mg oral, 4-8 week cycles.",
    "contra": "No human safety data (RUO, research only). Avoid in pregnancy/breastfeeding, hepatic or renal insufficiency, heart disease, active cancer, and minors.",
    "halfLife": "Not established (preclinical)",
    "freq": "Initial 5 mg/day s.c. (range 2-5 mg/day) or 25 mg/day oral; short cycles of 4-8 weeks. Preclinical rodent reference: 25-50 mg/kg/day."
  }
};

  var templates = {
    reconst_es: "\n      <div class=\"module-hero\">\n        <div class=\"module-hero-info\">\n          <h1>\n            <span class=\"badge-tag\">Manual</span>\n            Guía de Reconstitución\n          </h1>\n          <p>Del polvo liofilizado a la solución, paso a paso y sin dañar el péptido en el intento.</p>\n        </div>\n      </div>\n\n      <!-- ¿Qué es? -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--cyan); font-size:0.95rem; margin-bottom:8px;\">¿Qué es reconstituir?</div>\n        <p style=\"font-size:0.86rem; color:var(--text-secondary); line-height:1.55; margin:0;\">\n          Los péptidos llegan como polvo seco —<em>liofilizado</em>— porque así aguantan años sin estropearse.\n          Reconstituir consiste en disolver ese polvo con un líquido (<strong>diluyente</strong>, normalmente agua\n          bacteriostática) hasta obtener una solución de concentración conocida, la única forma de calcular después\n          una dosis exacta. Todo el proceso se hace con el vial cerrado y material estéril.\n        </p>\n        <div style=\"font-size:0.8rem; color:var(--text-muted); line-height:1.5; margin-top:9px;\">\n          🧮 En MisPep: la <strong>Calc</strong> te dice qué volumen echar para tu concentración, el\n          <strong>Inventario</strong> lleva la cuenta de cada vial y su fecha de reconstitución, y\n          <strong>Label</strong> imprime la etiqueta para pegarla encima.\n        </div>\n      </div>\n\n      <!-- Conservación -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--cyan); font-size:0.95rem; margin-bottom:8px;\">Dónde guarda el polvo mientras tanto</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.6;\">\n          • <strong>Frigorífico (2-8 °C)</strong> — bien para el vial que estás usando y para plazos cortos.<br>\n          • <strong>Congelador (-20 °C)</strong> — la mejor casa del polvo: referencias habituales de\n          <strong>12 a 24 meses</strong> si no se toca.<br>\n          • <strong>En tránsito</strong> — el liofilizado aguanta unos días a temperatura ambiente protegido;\n          en cuanto llega, directo al frío.<br>\n          • En cualquier caso, lejos de <strong>luz directa, calor y humedad</strong>.\n        </div>\n        <div style=\"font-size:0.76rem; color:var(--text-muted); margin-top:8px; line-height:1.45;\">\n          Son referencias generales de investigación: si tu proveedor incluye un COA o una fecha de caducidad, manda esa.\n        </div>\n      </div>\n\n      <!-- Paso a paso -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--cyan); font-size:0.95rem; margin-bottom:10px;\">Los 5 pasos, en orden</div>\n\n        <div style=\"display:flex; gap:10px; margin-bottom:11px;\">\n          <div style=\"flex:0 0 24px; height:24px; border-radius:50%; background:rgba(6,182,212,0.18); border:1px solid rgba(6,182,212,0.5); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; color:var(--cyan);\">1</div>\n          <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.5;\"><strong style=\"color:var(--text-main);\">Sácalos del frío y déjalos templados.</strong> Vial y diluyente unos 15-20 minutos a temperatura ambiente. Mezclar en frío deja la solución turbia y te impide ver si se ha disuelto del todo.</div>\n        </div>\n\n        <div style=\"display:flex; gap:10px; margin-bottom:11px;\">\n          <div style=\"flex:0 0 24px; height:24px; border-radius:50%; background:rgba(6,182,212,0.18); border:1px solid rgba(6,182,212,0.5); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; color:var(--cyan);\">2</div>\n          <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.5;\"><strong style=\"color:var(--text-main);\">Iguala la presión del vial.</strong> La liofilización deja vacío dentro del frasco. Entra una aguja cargada un poco de aire y el vial se equaliza solo; así el líquido no salta fuera cuando lo eches.</div>\n        </div>\n\n        <div style=\"display:flex; gap:10px; margin-bottom:11px;\">\n          <div style=\"flex:0 0 24px; height:24px; border-radius:50%; background:rgba(6,182,212,0.18); border:1px solid rgba(6,182,212,0.5); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; color:var(--cyan);\">3</div>\n          <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.5;\"><strong style=\"color:var(--text-main);\">Elige el diluyente.</strong> Agua bacteriostática o estéril para la inmensa mayoría. Excepciones: péptidos muy ácidos pueden necesitar agua con un poco de ácido acético, y los hidrofóbicos hasta ~50% de ácido acético acuoso para disolverse del todo. MisPep trabaja con agua BAC por defecto.</div>\n        </div>\n\n        <div style=\"display:flex; gap:10px; margin-bottom:11px;\">\n          <div style=\"flex:0 0 24px; height:24px; border-radius:50%; background:rgba(6,182,212,0.18); border:1px solid rgba(6,182,212,0.5); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; color:var(--cyan);\">4</div>\n          <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.5;\"><strong style=\"color:var(--text-main);\">Echa el líquido despacio, por la pared.</strong> Que el chorro baje por el cristal, nunca directo sobre el polvo. Después gira el vial con suavidad hasta que quede todo disuelto. <strong style=\"color:#f0a08a;\">Nunca lo agites</strong>: la agitación rompe la estructura del péptido.</div>\n        </div>\n\n        <div style=\"display:flex; gap:10px;\">\n          <div style=\"flex:0 0 24px; height:24px; border-radius:50%; background:rgba(6,182,212,0.18); border:1px solid rgba(6,182,212,0.5); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; color:var(--cyan);\">5</div>\n          <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.5;\"><strong style=\"color:var(--text-main);\">Pon el volumen correcto.</strong> Lo habitual son 1-2,5 mL por vial. Más líquido no mejora nada: solo te deja la solución más diluida. Escribe la concentración objetivo en la <strong>Calc</strong> y ella te devuelve los mL exactos.</div>\n        </div>\n      </div>\n\n      <!-- Después -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--cyan); font-size:0.95rem; margin-bottom:8px;\">Después de reconstituir</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.6;\">\n          • Espera a que la solución quede <strong>transparente y sin partículas</strong> antes de aspirar nada.<br>\n          • Al frío (2-8 °C), en el interior del frigorífico y <strong>protegido de la luz</strong>.<br>\n          • <strong>Anota la fecha de reconstitución</strong> en el vial — con Label la imprimes, y Inventario la guarda.<br>\n          • Ventana cómoda de uso: las <strong>primeras 4-8 semanas</strong>; como máximo <strong>~3 meses</strong> si siempre ha estado frío y limpio (ese es el tope que usa MisPep en sus etiquetas).<br>\n          • Nada de congelar y descongelar la solución: el hielo la rompe. Si es imprescindible, congela alícuotas de un solo uso.<br>\n          • Señales de alarma: turbidez que no se aclara, flotitos o color raro → <strong style=\"color:#f0a08a;\">no lo uses</strong>.\n        </div>\n      </div>\n\n      <!-- FAQ -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--cyan); font-size:0.95rem; margin-bottom:9px;\">Dudas rápidas</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.5;\">\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">¿Puedo agitarlo para que se disuelva antes?</strong><br>No. Gira el vial con calma; agitar denatura el péptido.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">¿Cuánta agua le echo?</strong><br>La que diga la Calc para tu concentración. Sin ella, 1-2,5 mL es el rango típico de referencia. Utiliza una cantidad de agua que te permita calcular las unidades de la jeringuilla/pluma con facilidad para tu dosis.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">¿Burbujea cuando pincho el tapón?</strong><br>Es la presión de la liofilización; el paso 2 la iguala y el problema desaparece.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">¿Agua del grifo o de botella?</strong><br>Agua estéril si vas a utilizar toda la preparación de una vez o en muy pocos días, en caso contrario Agua Bacteriostática (BAC) que contiene un 0,9% de Alcohol Bencílico para evitar proliferación bacteriana. El agua corriente arrastra microorganismos que contaminan el vial.</div>\n          <div><strong style=\"color:var(--text-main);\">¿Puedo congelar la solución hecha?</strong><br>Mejor no: los ciclos de hielo-descongelación degradan el péptido. En la nevera, dentro de su ventana de 4-8 semanas, es donde mejor vive.</div>\n        </div>\n      </div>\n    ",
    reconst_en: "\n      <div class=\"module-hero\">\n        <div class=\"module-hero-info\">\n          <h1>\n            <span class=\"badge-tag\" style=\"background:rgba(6,182,212,0.15); color:var(--cyan); border-color:rgba(6,182,212,0.3);\">Guide</span>\n            Peptide Reconstitution Guide\n          </h1>\n          <p>How to safely and accurately prepare lyophilized vials while preserving full biological potency.</p>\n        </div>\n      </div>\n\n      <!-- 1. QUÉ ES RECONSTITUIR -->\n      <div style=\"background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom:14px; box-shadow:0 4px 14px var(--shadow-ambient);\">\n        <div style=\"display:flex; align-items:center; gap:8px; margin-bottom:10px;\">\n          <span style=\"font-size:1.3rem;\">🧪</span>\n          <strong style=\"color:var(--text-main); font-size:1rem;\">What is Reconstitution?</strong>\n        </div>\n        <p style=\"font-size:0.87rem; color:var(--text-secondary); line-height:1.55; margin-bottom:10px;\">\n          <strong>Lyophilization and Diluent:</strong> Peptides are synthesized and lyophilized (vacuum freeze-dried) to ensure chemical stability during storage and transport. Presenting as a dehydrated crystalline cake or powder, they require reconstitution with an appropriate sterile liquid before administration.\n        </p>\n        <p style=\"font-size:0.87rem; color:var(--text-secondary); line-height:1.55; margin-bottom:10px;\">\n          <strong>Recommended Diluents:</strong>\n        </p>\n        <ul style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.55; margin-left:18px; margin-bottom:10px;\">\n          <li><strong style=\"color:var(--text-main);\">Bacteriostatic Water (BAC):</strong> Sterile water containing 0.9% benzyl alcohol. The gold standard for multi-dose vials, effectively preventing bacterial proliferation for weeks after opening.</li>\n          <li><strong style=\"color:var(--text-main);\">Sterile Water for Injection:</strong> Suitable only for single-dose use. Lacking a bacteriostatic preservative, any unused portion must be discarded within 24 hours.</li>\n          <li><strong style=\"color:var(--text-main);\">0.9% Acetic Acid or Saline:</strong> Occasionally needed for specific hydrophobic peptides with limited solubility in neutral water.</li>\n        </ul>\n        <div style=\"background:rgba(6,182,212,0.08); border-left:3px solid var(--cyan); padding:10px 12px; border-radius:8px; font-size:0.82rem; color:var(--text-secondary); line-height:1.5;\">\n          💡 <strong>Sterility Principle:</strong> Always disinfect stoppers with an alcohol swab (70% isopropyl alcohol) and allow to air dry completely before puncturing.\n        </div>\n      </div>\n\n      <!-- 2. CONSERVACIÓN DEL POLVO LIOFILIZADO -->\n      <div style=\"background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom:14px; box-shadow:0 4px 14px var(--shadow-ambient);\">\n        <div style=\"display:flex; align-items:center; gap:8px; margin-bottom:10px;\">\n          <span style=\"font-size:1.3rem;\">❄️</span>\n          <strong style=\"color:var(--text-main); font-size:1rem;\">Lyophilized Powder Storage</strong>\n        </div>\n        <div style=\"display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;\">\n          <div style=\"background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:12px;\">\n            <div style=\"color:var(--cyan); font-weight:800; font-size:0.88rem; margin-bottom:4px;\">Refrigerator (2–8 °C)</div>\n            <div style=\"font-size:0.8rem; color:var(--text-secondary); line-height:1.45;\">Months of stability without notable degradation. Ideal for vials planned for short-to-medium term use.</div>\n          </div>\n          <div style=\"background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:12px;\">\n            <div style=\"color:var(--accent); font-weight:800; font-size:0.88rem; margin-bottom:4px;\">Freezer (-20 °C)</div>\n            <div style=\"font-size:0.8rem; color:var(--text-secondary); line-height:1.45;\">Long-term storage (12 to 24 months). Prevent repeated freeze-thaw cycles.</div>\n          </div>\n        </div>\n        <div style=\"font-size:0.82rem; color:var(--text-muted); line-height:1.5;\">\n          🛡️ <strong>Light Protection:</strong> Keep vials shielded from direct UV radiation and sunlight, preferably in their protective amber container or dark box.\n        </div>\n      </div>\n\n      <!-- 3. PASO A PASO -->\n      <div style=\"background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom:14px; box-shadow:0 4px 14px var(--shadow-ambient);\">\n        <div style=\"display:flex; align-items:center; gap:8px; margin-bottom:14px;\">\n          <span style=\"font-size:1.3rem;\">📋</span>\n          <strong style=\"color:var(--text-main); font-size:1rem;\">Step-by-Step Reconstitution Protocol</strong>\n        </div>\n\n        <div style=\"margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border-color);\">\n          <div style=\"color:var(--text-main); font-weight:800; font-size:0.9rem; margin-bottom:4px;\">1. Acclimatization and Asepsis</div>\n          <div style=\"font-size:0.83rem; color:var(--text-secondary); line-height:1.5;\">\n            Remove the lyophilized vial from cold storage 10–15 minutes beforehand so it reaches room temperature. Clean the rubber stoppers of both the peptide vial and the BAC water vial with a fresh 70% alcohol wipe.\n          </div>\n        </div>\n\n        <div style=\"margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border-color);\">\n          <div style=\"color:var(--text-main); font-weight:800; font-size:0.9rem; margin-bottom:4px;\">2. Equalize Vial Vacuum Pressure</div>\n          <div style=\"font-size:0.83rem; color:var(--text-secondary); line-height:1.5;\">\n            Lyophilized vials are sealed under negative pressure (vacuum). Insert a sterile syringe filled with air to equalize pressure, preventing diluent from rushing in aggressively upon puncture.\n          </div>\n        </div>\n\n        <div style=\"margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border-color);\">\n          <div style=\"color:var(--text-main); font-weight:800; font-size:0.9rem; margin-bottom:4px;\">3. Diluent Measurement</div>\n          <div style=\"font-size:0.83rem; color:var(--text-secondary); line-height:1.5;\">\n            Draw the exact volume of BAC water calculated in MisPep Calc (commonly 1.0 mL, 2.0 mL, or 2.5 mL). Precision here ensures exact subsequent dosing.\n          </div>\n        </div>\n\n        <div style=\"margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border-color);\">\n          <div style=\"color:var(--text-main); font-weight:800; font-size:0.9rem; margin-bottom:4px;\">4. Gentle Wall Injection</div>\n          <div style=\"font-size:0.83rem; color:var(--text-secondary); line-height:1.5;\">\n            Angle the needle toward the inner glass wall of the vial. Depress the plunger slowly so the diluent cascades smoothly down the glass rather than blasting directly onto the peptide cake.\n          </div>\n        </div>\n\n        <div>\n          <div style=\"color:var(--text-main); font-weight:800; font-size:0.9rem; margin-bottom:4px;\">5. Dissolution Without Shaking</div>\n          <div style=\"font-size:0.83rem; color:var(--text-secondary); line-height:1.5;\">\n            <strong>Never shake vigorously.</strong> Peptides are fragile chains susceptible to mechanical shear forces. Swirl the vial gently between your palms or allow passive dissolution in the refrigerator for 15–30 minutes until crystal clear.\n          </div>\n        </div>\n      </div>\n\n      <!-- 4. CONSEJOS Y DUDAS -->\n      <div style=\"background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom:16px; box-shadow:0 4px 14px var(--shadow-ambient);\">\n        <div style=\"font-weight:800; color:var(--cyan); font-size:0.95rem; margin-bottom:9px;\">Quick FAQ</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.5;\">\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Can I shake the vial to dissolve it faster?</strong><br>No. Swirl gently; vigorous shaking denatures peptide tertiary bonds.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">How much water should I add?</strong><br>As indicated by the Calc for your target concentration. Without it, 1–2.5 mL is the standard reference range. Use an amount of water that makes calculating your syringe/pen units easy for your dose.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Does it bubble when puncturing the stopper?</strong><br>That is caused by manufacturing vacuum; Step 2 equalizes pressure and prevents bubbling.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Tap or bottled water?</strong><br>Sterile water if using the entire preparation at once or within very few days, otherwise Bacteriostatic Water (BAC) containing 0.9% Benzyl Alcohol to prevent bacterial proliferation. Tap water carries microorganisms that contaminate the vial.</div>\n          <div><strong style=\"color:var(--text-main);\">Can I freeze the reconstituted solution?</strong><br>Better not: repeated freeze-thaw cycles break down peptide chains. Store inside the refrigerator door-less zone within 4–8 weeks.</div>\n        </div>\n      </div>\n",
    glosario_es: "\n      <div class=\"module-hero\">\n        <div class=\"module-hero-info\">\n          <h1>\n            <span class=\"badge-tag\">Glosario</span>\n            Glosario de Péptidos\n          </h1>\n          <p>Los términos que aparecen en fichas, envases y COA, explicados en castellano llano.</p>\n        </div>\n      </div>\n\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--purple); font-size:0.95rem; margin-bottom:9px;\">🧬 Fundamentos</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.55;\">\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Aminoácido</strong> — los ladrillos con los que se construye todo: hay 20 habituales, y enlazarlos es como pasar cuentas por un hilo.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Péptido</strong> — una cadena corta de aminoácidos: una mini-proteína. Si la cadena se alarga demasiado, ya se llama proteína.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Enlace peptídico</strong> — el \"nudo\" que sujeta aminoácido con aminoácido; al apretarse sale una molécula de agua.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Secuencia</strong> — el orden exacto de los aminoácidos. De él depende todo lo que hace el péptido, igual que de las letras depende una palabra.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Residuo</strong> — un aminoácido ya integrado en la cadena. \"Péptido de 10 residuos\" = 10 aminoácidos enlazados.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Oligopéptido / polipéptido</strong> — cadena muy corta (unos 2-20) / cadena larga; a partir de ~50 se habla de proteína.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Fragmento</strong> — trozo concreto de un péptido o proteína mayor, útil para averiguar qué parte es la que trabaja.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Análogo</strong> — un péptido conocido con algún cambio puntual, para observar cómo cambia su comportamiento.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Péptido sintético</strong> — hecho en laboratorio desde cero, sin extraerlo de plantas o animales: es el caso de casi todo lo que se maneja aquí.</div>\n          <div><strong style=\"color:var(--text-main);\">Biorregulador</strong> — péptido diminuto (2-4 aminoácidos) presente en tejidos, estudiado por su efecto sobre la actividad celular.</div>\n        </div>\n      </div>\n\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--purple); font-size:0.95rem; margin-bottom:9px;\">⚡ Cómo actúan</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.55;\">\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Receptor</strong> — el \"aparcamiento\" de la célula donde encaja una molécula concreta y se enciende una señal. Imáginalo como un candado.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Ligando</strong> — la llave que encaja en ese candado y cambia lo que hace la célula.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Agonista</strong> — molécula que mete la llave y <em>enciende</em> el receptor.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Antagonista</strong> — la que tapona el candado sin girarlo: bloquea la señal. Lo contrario de un agonista.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Agonista dual / triple</strong> — una sola molécula que enciende dos receptores (p. ej. GIP y GLP-1) o tres (añadiendo glucagón) a la vez: típico de tirzepatida y retatrutida.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Selectividad</strong> — cuánto se ocupa solo de su diana y de nada más. La ipamorelina es muy selectiva; los GHRP clásicos, menos.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Semivida</strong> — tiempo en que se degrada la mitad del compuesto. De ella depende cada cuánto toca dosificar.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">GHRH</strong> — la hormona que la hipófisis recibe para soltar GH. Sermorelina y CJC-1295 imitan exactamente esa señal.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">GHRP / secretagogo</strong> — péptidos que piden GH por el camino de la grelina: ipamorelina, GHRP-2, hexarelina…</div>\n          <div><strong style=\"color:var(--text-main);\">IGF-1</strong> — proteína que actúa \"aguas abajo\" de la hormona del crecimiento; muchos estudios del eje GH miran sus niveles.</div>\n        </div>\n      </div>\n\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--purple); font-size:0.95rem; margin-bottom:9px;\">🔬 Pureza y análisis (lo que ves en el COA)</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.55;\">\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Pureza</strong> — qué porcentaje de lo que detecta el test es el péptido buscado. Un 99% deja menos del 1% de impurezas. Importante: <em>no</em> dice cuántos mg hay en el vial; eso es otra medición.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">HPLC</strong> — la técnica que mide esa pureza. Es el número estrella de cualquier certificado.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">COA (Certificado de Análisis)</strong> — informe de lote: identidad del producto, número de lote y resultados de los ensayos.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Espectrometría de masas (MS)</strong> — pesa la molécula con precisión y confirma su peso esperado; apoya la identidad sin probar por sí sola la secuencia completa.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Peso molecular (MW)</strong> — cuánto \"pesa\" una molécula. Sirve para confirmar identidad y para pasar de mg a molar.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Número CAS</strong> — el DNI único de cada compuesto químico; evita confusiones entre nombres comerciales.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Contenido neto de péptido</strong> — qué parte del polvo es realmente péptido al descontar los restos de fabricación.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">RUO (solo investigación)</strong> — etiqueta legal: producto para laboratorio, no para personas ni animales.</div>\n          <div><strong style=\"color:var(--text-main);\">In vitro</strong> — literalmente \"en vidrio\": ensayos en placas y tubos, fuera de un organismo vivo.</div>\n        </div>\n      </div>\n\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--purple); font-size:0.95rem; margin-bottom:9px;\">🧊 Manejo y formulación</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.55;\">\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Liofilizado</strong> — polvo seco obtenido congelando el material y extrayendo el agua: la forma en que llegan los viales y la que más dura.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Reconstitución</strong> — añadir el diluyente al polvo para volver a la solución. El \"cómo\" está en la Guía de Reconstitución de este menú.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Diluyente</strong> — el líquido que disuelve el polvo; lo habitual es agua bacteriostática.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Solubilidad</strong> — lo fácil que se disuelve un péptido. Los hidrofóbicos pueden exigir ácido acético diluido.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Blend (mezcla)</strong> — un vial con dos o más péptidos en proporción fija para estudiarlos juntos (Wolverine, Glow, Klow…).</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Contraión / sal de acetato</strong> — molécula \"compañera\" que se queda unida al péptido para que el polvo aguante estable; es parte normal de cómo se suministra.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Excipiente</strong> — ingrediente extra añadido al vial para proteger o dar volumen al producto.</div>\n          <div style=\"margin-bottom:8px;\"><strong style=\"color:var(--text-main);\">Solución de trabajo</strong> — solución ya diluida, lista para uso diario, preparada a partir de una concentrada.</div>\n          <div><strong style=\"color:var(--text-main);\">Marcado / sin marcar (tagged/untagged)</strong> — si el péptido lleva algún marcador molecular extra o va tal cual, sin nada añadido.</div>\n        </div>\n      </div>\n    ",
    glosario_en: "\n      <div class=\"module-hero\">\n        <div class=\"module-hero-info\">\n          <h1>\n            <span class=\"badge-tag\" style=\"background:rgba(139,92,246,0.15); color:var(--purple); border-color:rgba(139,92,246,0.3);\">Glossary</span>\n            Peptide Glossary\n          </h1>\n          <p>Key biochemistry, purity, pharmacokinetics, and formulation terminology explained clearly and rigorously.</p>\n        </div>\n      </div>\n\n      <!-- BLOQUE 1: FUNDAMENTOS -->\n      <div style=\"background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom:14px; box-shadow:0 4px 14px var(--shadow-ambient);\">\n        <div style=\"color:var(--purple); font-weight:800; font-size:0.95rem; margin-bottom:10px;\">1. Molecular Fundamentals and Structure</div>\n        <div style=\"font-size:0.84rem; color:var(--text-secondary); line-height:1.55;\">\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Amino Acid:</strong> Basic structural unit of peptides and proteins. Composed of an amino group, a carboxyl group, and a distinct side chain (R group).</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Peptide:</strong> Short chain of amino acids (typically 2 to 50) joined by covalent peptide bonds.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Peptide Bond:</strong> Amide-type covalent bond formed between the carboxyl group of one amino acid and the amino group of another with loss of water.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Sequence:</strong> The exact linear order of amino acids from the N-terminus to the C-terminus, determining biological activity and spatial conformation.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Residue:</strong> An individual amino acid once incorporated into a peptide chain.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Oligopeptide / Polypeptide:</strong> Oligopeptides contain 2 to 20 amino acids; polypeptides contain longer chains up to ~50 amino acids (beyond which they are generally termed proteins).</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Fragment:</strong> A functional subsegment of a larger peptide that retains or isolates specific bioactivity (e.g. AOD-9604, hGH 176-191).</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Analogue:</strong> A synthetic molecule modified in amino acid sequence or side chains to improve stability, receptor affinity, or pharmacokinetic half-life.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Synthetic Peptide:</strong> A peptide produced via chemical Solid Phase Peptide Synthesis (SPPS) rather than biological tissue extraction.</div>\n          <div><strong style=\"color:var(--text-main);\">Bioregulator:</strong> Short peptide (2 to 4 amino acids) that interacts epigenetically with DNA promoter regions to modulate organ-specific cellular homeostasis (e.g. Epitalon).</div>\n        </div>\n      </div>\n\n      <!-- BLOQUE 2: FARMACOLOGÍA -->\n      <div style=\"background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom:14px; box-shadow:0 4px 14px var(--shadow-ambient);\">\n        <div style=\"color:var(--cyan); font-weight:800; font-size:0.95rem; margin-bottom:10px;\">2. Mechanism of Action and Pharmacology</div>\n        <div style=\"font-size:0.84rem; color:var(--text-secondary); line-height:1.55;\">\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Receptor:</strong> Cellular protein structure that recognizes and binds a specific molecule, initiating a downstream intracellular signaling cascade.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Ligand:</strong> Any molecule that selectively binds to a target receptor (peptides act as endogenous or synthetic ligands).</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Agonist:</strong> A ligand that binds to a receptor and triggers its full biological response.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Antagonist:</strong> A molecule that binds to a receptor without activating it, blocking endogenous agonist binding.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Dual / Triple Agonists:</strong> Engineered molecules capable of activating two or three distinct receptor families simultaneously (e.g. Tirzepatide GIP/GLP-1, Retatrutide GIP/GLP-1/Glucagon).</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Selectivity:</strong> The degree to which a peptide binds preferentially to one receptor subtype over others, minimizing off-target adverse effects.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Half-Life (t1/2):</strong> Time required for circulating plasma concentration to decrease by 50% through metabolic clearance and elimination.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">GHRH (Growth Hormone Releasing Hormone):</strong> Hypothalamic hormone family that stimulates pituitary synthesis and release of GH (e.g. Sermorelin, CJC-1295).</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">GHRP (Growth Hormone Releasing Peptide):</strong> Ghrelin receptor agonists triggering pulsatile pituitary GH release (e.g. Ipamorelin, GHRP-2).</div>\n          <div><strong style=\"color:var(--text-main);\">IGF-1 (Insulin-like Growth Factor 1):</strong> Primary downstream mediator of GH anabolic and regenerative effects on target tissues.</div>\n        </div>\n      </div>\n\n      <!-- BLOQUE 3: ANÁLISIS Y COA -->\n      <div style=\"background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom:14px; box-shadow:0 4px 14px var(--shadow-ambient);\">\n        <div style=\"color:var(--emerald); font-weight:800; font-size:0.95rem; margin-bottom:10px;\">3. Quality Control and Analysis (COA)</div>\n        <div style=\"font-size:0.84rem; color:var(--text-secondary); line-height:1.55;\">\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Purity (%):</strong> Proportion of target peptide relative to synthesis impurities (truncated sequences, oxidation products), measured by HPLC (standards typically ≥98% or ≥99%).</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">HPLC (High Performance Liquid Chromatography):</strong> Analytical chromatography technique that separates and quantifies chemical components with high precision.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">COA (Certificate of Analysis):</strong> Formal laboratory report verifying purity, analytical mass spectrometry, and net content of a specific production batch.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Mass Spectrometry (MS):</strong> Confirmatory analysis measuring molecular mass (m/z) to ensure correct chemical structure identity.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Molecular Weight (MW):</strong> Total molecular mass of the peptide expressed in Daltons (Da) or g/mol.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">CAS Number:</strong> International Chemical Abstracts Service registry identifier uniquely labeling the chemical substance.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Net Peptide Content:</strong> The actual proportion of pure peptide in the vial, excluding counter-ions (acetate, trifluoroacetate) and residual moisture.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">RUO (Research Use Only):</strong> Regulatory classification indicating the substance is intended strictly for in vitro and scientific research.</div>\n          <div><strong style=\"color:var(--text-main);\">In Vitro / In Vivo:</strong> Experimental studies conducted outside a living organism in controlled cell culture (in vitro) versus in whole living organisms (in vivo).</div>\n        </div>\n      </div>\n\n      <!-- BLOQUE 4: MANEJO -->\n      <div style=\"background:var(--card-bg-elevated); border:1px solid var(--border-color); border-radius:16px; padding:16px; margin-bottom:16px; box-shadow:0 4px 14px var(--shadow-ambient);\">\n        <div style=\"color:var(--amber); font-weight:800; font-size:0.95rem; margin-bottom:10px;\">4. Handling, Formulation, and Stability</div>\n        <div style=\"font-size:0.84rem; color:var(--text-secondary); line-height:1.55;\">\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Lyophilization:</strong> Industrial sublimation process removing water from frozen product under high vacuum, yielding a dry stable cake.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Reconstitution:</strong> Rehydrating lyophilized peptide with a suitable sterile liquid to obtain a working administration solution.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Diluent:</strong> Inert liquid carrier used to dissolve the peptide without altering its chemical identity (BAC water, sterile water, 0.9% saline).</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Solubility:</strong> The maximum capacity of a peptide to dissolve homogenously in a given liquid volume at specific temperature and pH.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Blends:</strong> Co-formulations combining two or more distinct peptides in a single vial (e.g. Wolverine: BPC-157 + TB-500).</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Acetate Salts:</strong> Stable salt form replacing trifluoroacetate (TFA) to improve biocompatibility and physiological tolerance.</div>\n          <div style=\"margin-bottom:9px;\"><strong style=\"color:var(--text-main);\">Excipients:</strong> Bulking agents (such as mannitol) added to stabilize the cake during freeze-drying.</div>\n          <div><strong style=\"color:var(--text-main);\">Working Solution:</strong> The reconstituted liquid at target concentration ready for precise volumetric measurement.</div>\n        </div>\n      </div>\n",
    duracion_es: "\n      <div class=\"module-hero\">\n        <div class=\"module-hero-info\">\n          <h1>\n            <span class=\"badge-tag\">Estabilidad</span>\n            ¿Cuánto Dura el Péptido?\n          </h1>\n          <p>Qué influye en su conservación y cuánto aguanta el polvo frente a la solución ya hecha.</p>\n        </div>\n      </div>\n\n      <!-- Estimador -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--amber); font-size:0.95rem; margin-bottom:10px;\">⏱️ Estimador rápido</div>\n\n        <div style=\"font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;\">Forma del péptido:</div>\n        <div class=\"pill-grid\" id=\"durFormPills\" style=\"display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;\">\n          <button type=\"button\" class=\"pill-3d active\" data-dur-form=\"liof\">🧴 Polvo liofilizado</button>\n          <button type=\"button\" class=\"pill-3d\" data-dur-form=\"sol\">💉 Solución reconstituida</button>\n        </div>\n\n        <div style=\"font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;\">Conservación:</div>\n        <div class=\"pill-grid\" id=\"durTempPills\" style=\"display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;\">\n          <button type=\"button\" class=\"pill-3d\" data-dur-temp=\"cong\">❄️ Congelador -20 °C</button>\n          <button type=\"button\" class=\"pill-3d active\" data-dur-temp=\"frio\">🧊 Frigorífico 2-8 °C</button>\n          <button type=\"button\" class=\"pill-3d\" data-dur-temp=\"amb\">🌡️ Ambiente 20-25 °C</button>\n        </div>\n\n        <div id=\"durResult\" style=\"background:rgba(245,158,11,0.10); border:1px solid rgba(245,158,11,0.35); border-radius:12px; padding:11px 13px; font-size:0.86rem; line-height:1.5; color:var(--text-secondary);\">\n          Elige forma y conservación para ver la estimación.\n        </div>\n        <div style=\"font-size:0.74rem; color:var(--text-muted); margin-top:8px; line-height:1.45;\">\n          Estimación orientativa de investigación, no una garantía: pH extremos, luz y repetidos ciclos de\n          descongelación acortan la ventana. Consulta el COA de tu lote cuando lo tengas.\n        </div>\n      </div>\n\n      <!-- Factores -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--amber); font-size:0.95rem; margin-bottom:8px;\">Los 4 factores que deciden todo</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.6;\">\n          <strong style=\"color:var(--text-main);\">Temperatura.</strong> El frío frena las reacciones que rompen el péptido. Congelador para almacenar, frigorífico para usar; evita congelar ya la solución.<br>\n          <strong style=\"color:var(--text-main);\">pH.</strong> Los extremos ácidos o alcalinos aceleran la degradación; el entorno neutro (pH 6-7) es el más estable para la mayoría de las secuencias.<br>\n          <strong style=\"color:var(--text-main);\">Luz y oxígeno.</strong> La luz UV y el aire hacen su trabajo invisible: vial cerrado y a oscuras.<br>\n          <strong style=\"color:var(--text-main);\">Forma.</strong> El polvo liofilizado aguanta muchísimo más que la misma molécula ya disuelta. Por eso conviene reconstituir solo lo que vayas a usar.\n        </div>\n      </div>\n\n      <!-- Tabla -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--amber); font-size:0.95rem; margin-bottom:10px;\">Tabla de referencia</div>\n        <div style=\"font-size:0.82rem; line-height:1.5;\">\n          <div style=\"display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-bottom:1px solid var(--border-color);\">\n            <span style=\"color:var(--text-secondary);\">🧴 Polvo · congelador <span style=\"white-space:nowrap;\">-20 °C</span></span>\n            <strong style=\"color:var(--text-main); white-space:nowrap;\">12-24 meses</strong>\n          </div>\n          <div style=\"display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-bottom:1px solid var(--border-color);\">\n            <span style=\"color:var(--text-secondary);\">🧴 Polvo · frigorífico <span style=\"white-space:nowrap;\">2-8 °C</span></span>\n            <strong style=\"color:var(--text-main); white-space:nowrap;\">meses (ideal al congelador)</strong>\n          </div>\n          <div style=\"display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-bottom:1px solid var(--border-color);\">\n            <span style=\"color:var(--text-secondary);\">💉 Solución · frigorífico <span style=\"white-space:nowrap;\">2-8 °C</span></span>\n            <strong style=\"color:var(--text-main); white-space:nowrap;\">4-8 sem (máx. ~3 meses)</strong>\n          </div>\n          <div style=\"display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-bottom:1px solid var(--border-color);\">\n            <span style=\"color:var(--text-secondary);\">🌡️ Solución · ambiente</span>\n            <strong style=\"color:var(--text-main); white-space:nowrap;\">horas a pocos días</strong>\n          </div>\n          <div style=\"display:flex; justify-content:space-between; gap:10px; padding:7px 0;\">\n            <span style=\"color:var(--text-secondary);\">📦 Polvo · en tránsito</span>\n            <strong style=\"color:var(--text-main); white-space:nowrap;\">aguanta días protegido</strong>\n          </div>\n        </div>\n      </div>\n\n      <!-- Reglas -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--amber); font-size:0.95rem; margin-bottom:8px;\">Reglas que alargan la vida de tu vial</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.6;\">\n          • Marca la <strong>fecha de reconstitución</strong> en cuanto abres el vial (Label / Inventario).<br>\n          • De vuelta al frío en cuanto terminas de manipular: <strong>minutos fuera</strong>, no horas.<br>\n          • Tapón con <strong>alcohol</strong> antes de cada pinchazo y jeringa limpia: la contaminación acorta la vida útil.<br>\n          • <strong>No agites</strong> y no congeles la solución ya hecha.<br>\n          • Reconstituye <strong>lo justo</strong>: lo que no vayas a usar en su ventana, déjalo en polvo.<br>\n          • Guarda el vial <strong>a oscuras</strong>: ni luz directa ni en el parasol del coche.\n        </div>\n      </div>\n    ",
    duracion_en: "\n      <div class=\"module-hero\">\n        <div class=\"module-hero-info\">\n          <h1>\n            <span class=\"badge-tag\">Stability</span>\n            How Long Does a Peptide Last?\n          </h1>\n          <p>What influences preservation and how long powder lasts compared to reconstituted solution.</p>\n        </div>\n      </div>\n\n      <!-- Estimador -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--amber); font-size:0.95rem; margin-bottom:10px;\">⏱️ Quick Stability Estimator</div>\n\n        <div style=\"font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;\">Peptide state:</div>\n        <div class=\"pill-grid\" id=\"durFormPills\" style=\"display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;\">\n          <button type=\"button\" class=\"pill-3d active\" data-dur-form=\"liof\">🧴 Lyophilized powder</button>\n          <button type=\"button\" class=\"pill-3d\" data-dur-form=\"sol\">💉 Reconstituted solution</button>\n        </div>\n\n        <div style=\"font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;\">Storage:</div>\n        <div class=\"pill-grid\" id=\"durTempPills\" style=\"display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;\">\n          <button type=\"button\" class=\"pill-3d\" data-dur-temp=\"cong\">❄️ Freezer -20 °C</button>\n          <button type=\"button\" class=\"pill-3d active\" data-dur-temp=\"frio\">🧊 Fridge 2-8 °C</button>\n          <button type=\"button\" class=\"pill-3d\" data-dur-temp=\"amb\">🌡️ Room Temp 20-25 °C</button>\n        </div>\n\n        <div id=\"durResult\" style=\"background:rgba(245,158,11,0.10); border:1px solid rgba(245,158,11,0.35); border-radius:12px; padding:11px 13px; font-size:0.86rem; line-height:1.5; color:var(--text-secondary);\">\n          Choose peptide state and storage condition to see the estimate.\n        </div>\n        <div style=\"font-size:0.74rem; color:var(--text-muted); margin-top:8px; line-height:1.45;\">\n          Research reference estimate, not a legal guarantee: extreme pH, UV light, and repeated freeze-thaw cycles shorten stability. Consult your batch Certificate of Analysis (COA).\n        </div>\n      </div>\n\n      <!-- Factores -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--amber); font-size:0.95rem; margin-bottom:8px;\">The 4 Decisive Factors</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.6;\">\n          <strong style=\"color:var(--text-main);\">Temperature.</strong> Cold slows down hydrolysis and oxidation reactions. Freezer for storage, refrigerator for active use; avoid freezing once reconstituted.<br>\n          <strong style=\"color:var(--text-main);\">pH.</strong> Extreme acidic or alkaline conditions accelerate chain degradation; neutral environment (pH 6-7) is the most stable for the majority of sequences.<br>\n          <strong style=\"color:var(--text-main);\">Light and oxygen.</strong> UV light and air cause invisible molecular cleavage: keep vials airtight and shielded in darkness.<br>\n          <strong style=\"color:var(--text-main);\">Form.</strong> Lyophilized powder lasts vastly longer than the same molecule once dissolved. Reconstitute only the vial you are actively using.\n        </div>\n      </div>\n\n      <!-- Tabla -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--amber); font-size:0.95rem; margin-bottom:10px;\">Reference Table</div>\n        <div style=\"font-size:0.82rem; line-height:1.5;\">\n          <div style=\"display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-bottom:1px solid var(--border-color);\">\n            <span style=\"color:var(--text-secondary);\">🧴 Powder · freezer <span style=\"white-space:nowrap;\">-20 °C</span></span>\n            <strong style=\"color:var(--text-main); white-space:nowrap;\">12-24 months</strong>\n          </div>\n          <div style=\"display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-bottom:1px solid var(--border-color);\">\n            <span style=\"color:var(--text-secondary);\">🧴 Powder · fridge <span style=\"white-space:nowrap;\">2-8 °C</span></span>\n            <strong style=\"color:var(--text-main); white-space:nowrap;\">months (ideally freezer)</strong>\n          </div>\n          <div style=\"display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-bottom:1px solid var(--border-color);\">\n            <span style=\"color:var(--text-secondary);\">💉 Solution · fridge <span style=\"white-space:nowrap;\">2-8 °C</span></span>\n            <strong style=\"color:var(--text-main); white-space:nowrap;\">4-8 wks (max ~3 mos)</strong>\n          </div>\n          <div style=\"display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-bottom:1px solid var(--border-color);\">\n            <span style=\"color:var(--text-secondary);\">🌡️ Solution · room temp</span>\n            <strong style=\"color:var(--text-main); white-space:nowrap;\">hours to few days</strong>\n          </div>\n          <div style=\"display:flex; justify-content:space-between; gap:10px; padding:7px 0;\">\n            <span style=\"color:var(--text-secondary);\">📦 Powder · in transit</span>\n            <strong style=\"color:var(--text-main); white-space:nowrap;\">withstands days protected</strong>\n          </div>\n        </div>\n      </div>\n\n      <!-- Reglas -->\n      <div class=\"card-section\" style=\"padding:14px; margin-bottom:12px;\">\n        <div style=\"font-weight:800; color:var(--amber); font-size:0.95rem; margin-bottom:8px;\">Rules to Extend Vial Shelf Life</div>\n        <div style=\"font-size:0.85rem; color:var(--text-secondary); line-height:1.6;\">\n          • Mark the <strong>date of reconstitution</strong> as soon as you open the vial (Label / Inventory).<br>\n          • Return to cold immediately after handling: <strong>minutes outside</strong>, never hours.<br>\n          • Swab stopper with <strong>70% alcohol</strong> before every draw using a sterile syringe.<br>\n          • <strong>Do not shake</strong> and never freeze reconstituted solution.<br>\n          • Reconstitute <strong>only what you need</strong>: keep backup supply in dry powder form.<br>\n          • Store the vial <strong>in complete darkness</strong>: shielded from direct UV and ambient light.\n        </div>\n      </div>\n"
  };

  var ui = {
    es: {
      brand_sub: 'Calculadoras Clínicas',
      lang_name: 'ES',
      lang_flag: '🇪🇸',
      theme_toggle: 'Cambiar tema',
      menu_btn: 'Abrir menú',
      // Nav inferior
      nav_salud: 'Salud',
      nav_calendario: 'Calendario',
      nav_calc: 'Calc',
      nav_nivel_pk: 'Nivel PK',
      nav_inventario: 'Inventario',
      // Drawer Categorías
      drawer_sec_tracking: 'SEGUIMIENTO',
      drawer_sec_planning: 'PLANIFICACIÓN Y RESERVAS',
      drawer_sec_clinical: 'HERRAMIENTAS CLÍNICAS',
      drawer_sec_education: 'EDUCACIÓN Y CONOCIMIENTO',
      drawer_sec_labs: 'ANALÍTICAS Y REPORTES',
      // Drawer items
      drawer_dashboard: 'Seguimiento y Datos de Salud',
      drawer_calendar: 'Calendario y Registro Diario',
      drawer_medications: 'Todas las Medicaciones',
      drawer_calc: 'Calc (Reconstitución Estándar)',
      drawer_reverse: 'Reverse (Calculadora Inversa)',
      drawer_blend: 'Blend (Mezclas Multi-péptido)',
      drawer_hgh: 'HGH (Somatropina en UI)',
      drawer_intranasal: 'Intranasal (Spray Dosificado)',
      drawer_plan: 'Plan (Titulación y Pautas)',
      drawer_runway: 'Runway (Duración de Suministro)',
      drawer_rotate: 'Rotate (Mapa de Inyecciones SubQ)',
      drawer_convert: 'Convert (Conversor de Unidades)',
      drawer_inventory: 'Inventario (Gestión de Viales)',
      drawer_label: 'Label (Etiquetas para Impresora)',
      drawer_coa: 'COA (Análisis de Pureza HPLC)',
      drawer_chart: 'Chart (Matriz de Referencia)',
      drawer_labs: 'Labs (Analíticas de Sangre)',
      drawer_research: 'Guía (Biblioteca de Péptidos)',
      drawer_reconst: 'Guía de Reconstitución',
      drawer_glosario: 'Glosario de Péptidos',
      drawer_duracion: '¿Cuánto Dura el Péptido?',
      // Dashboard
      dash_panel: 'Panel',
      dash_title: 'Seguimiento y Salud',
      dash_sub: 'Control de tratamiento, cuenta atrás de inyección y métricas corporales.',
      dash_on_track: 'en camino',
      dash_days: 'días',
      dash_injection: 'inyección',
      dash_in_circulation: 'EN CIRCULACIÓN AHORA',
      dash_tap_inspect: 'Toca o desliza sobre la gráfica para inspeccionar',
      dash_btn_shot: 'vamos a poner el pinchazo',
      dash_btn_weight: 'Registrar Peso',
      dash_btn_history: 'Historial',
      dash_btn_pdf: 'Exportar Informe PDF',
      dash_btn_manual_dose: 'Registrar Dosis Manual',
      dash_bateman_note: '💡 Ecuación de Bateman (1 compartimento): Los niveles representan la masa estimada en circulación, no una analítica sanguínea directa.',
      // Biblioteca
      search_placeholder: 'Buscar por nombre, categoría o indicación...',
      cat_all: 'Todos',
      load_in_calc: '⚡ Cargar Parámetros en Calculadora',
      sim_pk: '📊 Simulador PK',
      add_to_meds: '＋ Añadir a Medicamentos',
      in_meds: '✓ En la lista de medicamentos',
      contra_label: '⚠️ Contraindicaciones:',
      sugg_vial: 'Vial sugerido:',
      bac_water: 'Agua BAC:',
      typical_dose: 'Dosis habitual:',
      freq_label: 'Frecuencia:',
      halflife_label: 'Semivida:',
      dash_btn_pinchazo: 'Vamos a poner el pinchazo',
      dash_days_remaining: 'días restantes',
      dash_health_data: 'Datos de salud',
      dash_weekly_avg: 'Promedio semanal',
      dash_best_week: 'Mejor semana',
      dash_curr_weight: 'PESO ACTUAL',
      dash_total_change: 'CAMBIO TOTAL',
      dash_curr_bmi: 'IMC ACTUAL',
      dash_weight_evo: 'Evolución del Peso',
      dash_global_tracking: 'Seguimiento global ›',
      dash_tab_1m: '1 mes',
      dash_tab_3m: '3 meses',
      dash_tab_6m: '6 meses',
      dash_tab_all: 'Todo',
      dash_add_weight_btn: 'Añadir nuevo peso',
      dash_bp_evo: 'Evolución Presión Arterial',
      dash_bp_details: 'Ver detalles',
      dash_systolic: 'Sistólica',
      dash_diastolic: 'Diastólica',
      dash_pulse: 'Pulso',
      no_peptides_found: 'No se encontraron péptidos para la búsqueda o categoría seleccionada.'
    },
    en: {
      brand_sub: 'Clinical Calculators',
      lang_name: 'EN',
      lang_flag: '🇬🇧',
      theme_toggle: 'Toggle theme',
      menu_btn: 'Open menu',
      // Nav inferior
      nav_salud: 'Health',
      nav_calendario: 'Calendar',
      nav_calc: 'Calc',
      nav_nivel_pk: 'PK Level',
      nav_inventario: 'Inventory',
      // Drawer Categorías
      drawer_sec_tracking: 'TRACKING',
      drawer_sec_planning: 'PLANNING & SUPPLY',
      drawer_sec_clinical: 'CLINICAL TOOLS',
      drawer_sec_education: 'EDUCATION & KNOWLEDGE',
      drawer_sec_labs: 'LABS & REPORTS',
      // Drawer items
      drawer_dashboard: 'Tracking & Health Data',
      drawer_calendar: 'Calendar & Daily Log',
      drawer_medications: 'All Medications',
      drawer_calc: 'Calc (Standard Reconstitution)',
      drawer_reverse: 'Reverse (Reverse Calculator)',
      drawer_blend: 'Blend (Multi-peptide Blends)',
      drawer_hgh: 'HGH (Somatropin in IU)',
      drawer_intranasal: 'Intranasal (Dosed Spray)',
      drawer_plan: 'Plan (Titration & Schedules)',
      drawer_runway: 'Runway (Supply Duration)',
      drawer_rotate: 'Rotate (SubQ Injection Map)',
      drawer_convert: 'Convert (Unit Converter)',
      drawer_inventory: 'Inventory (Vial Management)',
      drawer_label: 'Label (Printable Labels)',
      drawer_coa: 'COA (HPLC Purity Test)',
      drawer_chart: 'Chart (Reference Matrix)',
      drawer_labs: 'Labs (Blood Biomarkers)',
      drawer_research: 'Guide (Peptide Library)',
      drawer_reconst: 'Reconstitution Guide',
      drawer_glosario: 'Peptide Glossary',
      drawer_duracion: 'How Long Does a Peptide Last?',
      // Dashboard
      dash_panel: 'Dashboard',
      dash_title: 'Tracking & Health',
      dash_sub: 'Treatment tracking, injection countdown, and body metrics.',
      dash_on_track: 'on track',
      dash_days: 'days',
      dash_injection: 'injection',
      dash_in_circulation: 'IN CIRCULATION NOW',
      dash_tap_inspect: 'Tap or slide on chart to inspect',
      dash_btn_shot: 'Take Injection',
      dash_btn_weight: 'Log Weight',
      dash_btn_history: 'History',
      dash_btn_pdf: 'Export PDF Report',
      dash_btn_manual_dose: 'Log Manual Dose',
      dash_bateman_note: '💡 Bateman Equation (1 compartment): Levels represent estimated circulating mass, not direct blood analytics.',
      // Biblioteca
      search_placeholder: 'Search by name, category, or indication...',
      cat_all: 'All',
      load_in_calc: '⚡ Load Parameters in Calculator',
      sim_pk: '📊 PK Simulator',
      add_to_meds: '＋ Add to Medications',
      in_meds: '✓ In Medications List',
      contra_label: '⚠️ Contraindications:',
      sugg_vial: 'Suggested vial:',
      bac_water: 'BAC Water:',
      typical_dose: 'Typical dose:',
      freq_label: 'Frequency:',
      halflife_label: 'Half-life:',
      dash_btn_pinchazo: 'Take Injection',
      dash_days_remaining: 'days remaining',
      dash_health_data: 'Health Metrics',
      dash_weekly_avg: 'Weekly average',
      dash_best_week: 'Best week',
      dash_curr_weight: 'CURRENT WEIGHT',
      dash_total_change: 'TOTAL CHANGE',
      dash_curr_bmi: 'CURRENT BMI',
      dash_weight_evo: 'Weight Evolution',
      dash_global_tracking: 'Global tracking ›',
      dash_tab_1m: '1 month',
      dash_tab_3m: '3 months',
      dash_tab_6m: '6 months',
      dash_tab_all: 'All',
      dash_add_weight_btn: 'Log new weight',
      dash_bp_evo: 'Blood Pressure Evolution',
      dash_bp_details: 'View details',
      dash_systolic: 'Systolic',
      dash_diastolic: 'Diastolic',
      dash_pulse: 'Pulse',
      no_peptides_found: 'No peptides found for the selected search or category.'
    }
  };

  function t(key, fallback) {
    var dict = ui[currentLang] || ui.es;
    return dict[key] || (ui.es && ui.es[key]) || fallback || key;
  }

  function getLang() {
    return currentLang;
  }

  function setLang(lang) {
    if (lang !== 'es' && lang !== 'en') lang = 'es';
    currentLang = lang;
    try {
      localStorage.setItem('mispep_lang', lang);
    } catch(e) {}
    apply();
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
    }
  }

  function toggleLang() {
    setLang(currentLang === 'es' ? 'en' : 'es');
  }

  function apply() {
    var isEn = (currentLang === 'en');
    document.documentElement.lang = currentLang;
    try { document.title = isEn ? 'MisPep - Peptide Calculators' : 'MisPep - Calculadoras de Péptidos'; } catch (e) {}

    // 1. Botón selector en cabecera
    var flagEl = document.getElementById('langFlag');
    var textEl = document.getElementById('langText');
    if (flagEl) flagEl.textContent = isEn ? '🇬🇧' : '🇪🇸';
    if (textEl) textEl.textContent = isEn ? 'EN' : 'ES';

    var btn = document.getElementById('langToggleBtn');
    if (btn && !btn._bound) {
      btn._bound = true;
      var lastToggleTime = 0;
      btn.onclick = function(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        var now = Date.now();
        if (now - lastToggleTime < 250) return; // evitar doble pulsación rápida
        lastToggleTime = now;
        try {
          if (window.AndroidBridge && window.AndroidBridge.haptic) {
            window.AndroidBridge.haptic(15);
          }
        } catch(ex) {}
        toggleLang();
      };
    }

    // Selector en el Drawer
    var dFlagEl = document.getElementById('drawerLangFlag');
    var dTextEl = document.getElementById('drawerLangText');
    if (dFlagEl) dFlagEl.textContent = isEn ? '🇬🇧' : '🇪🇸';
    if (dTextEl) dTextEl.textContent = isEn ? 'EN' : 'ES';

    var dBtn = document.getElementById('drawerLangToggleBtn');
    if (dBtn && !dBtn._bound) {
      dBtn._bound = true;
      dBtn.onclick = function(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        var now = Date.now();
        if (now - lastToggleTime < 250) return;
        lastToggleTime = now;
        try {
          if (window.AndroidBridge && window.AndroidBridge.haptic) {
            window.AndroidBridge.haptic(15);
          }
        } catch(ex) {}
        toggleLang();
      };
    }

    var dMainTitle = document.getElementById('drawerMainTitle');
    if (dMainTitle) dMainTitle.textContent = isEn ? 'All Modules' : 'Todos los Módulos';

    // 2. Subtítulo de marca
    var brandSub = document.querySelector('.brand-sub');
    if (brandSub) brandSub.textContent = t('brand_sub');

    // 3. Nav inferior
    var navMap = {
      'dashboard': 'nav_salud',
      'calendar': 'nav_calendario',
      'calc': 'nav_calc',
      'plan': 'nav_nivel_pk',
      'inventory': 'nav_inventario'
    };
    document.querySelectorAll('.bottom-nav .nav-item').forEach(function(item) {
      var key = navMap[item.dataset.target];
      var span = item.querySelector('span');
      if (key && span) span.textContent = t(key);
    });

    // 4. Secciones del Drawer
    var drawerSecs = document.querySelectorAll('.drawer-scroll > div[style*="font-size:0.68rem"]');
    if (drawerSecs.length >= 5) {
      drawerSecs[0].textContent = t('drawer_sec_tracking');
      drawerSecs[1].textContent = t('drawer_sec_planning');
      drawerSecs[2].textContent = t('drawer_sec_clinical');
      drawerSecs[3].textContent = t('drawer_sec_education');
      drawerSecs[4].textContent = t('drawer_sec_labs');
    }

    // 5. Items del Drawer
    var drawerItems = document.querySelectorAll('.drawer-item');
    drawerItems.forEach(function(item) {
      var target = item.dataset.target;
      var span = item.querySelector('span');
      if (target && span) {
        var k = 'drawer_' + target;
        if (ui[currentLang][k]) span.textContent = t(k);
      }
    });

    // 6. Guías completas (Reconstitución, Glosario, Duración)
    var reconstMod = document.getElementById('module-reconst');
    if (reconstMod) reconstMod.innerHTML = isEn ? templates.reconst_en : templates.reconst_es;

    var glosarioMod = document.getElementById('module-glosario');
    if (glosarioMod) glosarioMod.innerHTML = isEn ? templates.glosario_en : templates.glosario_es;

    var duracionMod = document.getElementById('module-duracion');
    if (duracionMod) {
      duracionMod.innerHTML = isEn ? templates.duracion_en : templates.duracion_es;
      if (window.initDuracionEstimador) window.initDuracionEstimador();
    }

    // 7. Textos estáticos de Dashboard
    var dashHeroH1 = document.querySelector('#module-dashboard .module-hero-info h1');
    if (dashHeroH1) {
      dashHeroH1.innerHTML = '<span class="badge-tag">' + t('dash_panel') + '</span> ' + t('dash_title');
    }
    var dashHeroP = document.querySelector('#module-dashboard .module-hero-info p');
    if (dashHeroP) dashHeroP.textContent = t('dash_sub');

    var shotBtn = document.getElementById('recordDoseBtn');
    if (shotBtn) shotBtn.textContent = '💉 ' + t('dash_btn_shot');

    var weightBtn = document.getElementById('openWeightBtn');
    if (weightBtn) weightBtn.textContent = '⚖️ ' + t('dash_btn_weight');

    var weightHistBtn = document.getElementById('openWeightHistoryBtn');
    if (weightHistBtn) weightHistBtn.textContent = '📋 ' + t('dash_btn_history');

    var exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) exportPdfBtn.textContent = '📄 ' + t('dash_btn_pdf');

    var manualDoseBtn = document.getElementById('dashRecordManualDoseBtn');
    if (manualDoseBtn) manualDoseBtn.textContent = '＋ ' + t('dash_btn_manual_dose');

    var searchInput = document.getElementById('researchSearchInput');
    if (searchInput) searchInput.placeholder = t('search_placeholder');

    var batemanBox = document.querySelector('#module-dashboard div[style*="border-left:3px solid var(--border-color)"]');
    if (batemanBox) batemanBox.textContent = t('dash_bateman_note');

    // Dashboard métricas y tarjetas
    var dashPinchazoBtn = document.getElementById('dashMarkDoseBtn');
    if (dashPinchazoBtn) dashPinchazoBtn.innerHTML = '💉 ' + t('dash_btn_pinchazo');

    var lblOnTrack = document.getElementById('dashLblOnTrack');
    if (lblOnTrack) lblOnTrack.textContent = isEn ? 'on track' : 'en camino';

    var lblInj = document.getElementById('dashLblInjection');
    if (lblInj) lblInj.textContent = isEn ? 'injection' : 'inyección';

    var circLabel = document.getElementById('benchCirculatingLabel');
    if (circLabel) circLabel.textContent = isEn ? 'In circulation now' : 'En circulación ahora';

    var scrubberText = document.getElementById('benchScrubberText');
    if (scrubberText && (scrubberText.textContent.includes('inspeccionar') || scrubberText.textContent.includes('inspect'))) {
      scrubberText.textContent = isEn ? 'Tap or slide on chart to inspect' : 'Toca o desliza sobre la gráfica para inspeccionar';
    }

    var protocolsLabel = document.getElementById('benchProtocolsLabel');
    if (protocolsLabel) protocolsLabel.textContent = isEn ? 'Active Protocols' : 'Protocolos Activos';

    var disclaimer = document.querySelector('.bench-disclaimer-card');
    if (disclaimer) {
      disclaimer.innerHTML = isEn
        ? '💡 <strong>Bateman Equation (1 compartment):</strong> Levels represent <em>estimated mass in circulation</em>, not a direct blood panel. Each curve models the half-life and subcutaneous depot absorption of its compound; triangles <strong>▲</strong> mark doses. When changing medication, the previous curve decays and the new one starts overlaid in its color.'
        : '💡 <strong>Ecuación de Bateman (1 compartimento):</strong> Los niveles representan la <em>masa estimada en circulación</em>, no una analítica sanguínea directa. Cada curva usa la vida media de su propio fármaco y absorción subcutánea depot; los triángulos <strong>▲</strong> marcan las dosis administradas. Al cambiar de medicación, la curva anterior decae a cero y la nueva arranca superpuesta con su color.';
    }

    var nextInjSub = document.querySelector('.next-inj-sub');
    if (nextInjSub) nextInjSub.textContent = t('dash_days_remaining');

    var healthTitle = document.querySelector('.health-data-section .card-title span');
    if (healthTitle) healthTitle.textContent = t('dash_health_data');

    var weeklyAvgTitle = document.querySelector('.health-card-blue .health-card-title');
    if (weeklyAvgTitle) weeklyAvgTitle.textContent = t('dash_weekly_avg');

    var bestWeekTitle = document.querySelector('.health-card-beige .health-card-title');
    if (bestWeekTitle) bestWeekTitle.textContent = t('dash_best_week');

    var wTitle = document.querySelector('.health-card-mint .health-card-title');
    if (wTitle) wTitle.textContent = t('dash_curr_weight');

    var tcTitle = document.querySelectorAll('.health-grid-3 .health-card-blue .health-card-title')[0];
    if (tcTitle) tcTitle.textContent = t('dash_total_change');

    var bmiTitle = document.querySelectorAll('.health-grid-3 .health-card-beige .health-card-title')[0];
    if (bmiTitle) bmiTitle.textContent = t('dash_curr_bmi');

    var weightEvoTitle = document.querySelector('#module-dashboard div[style*="border-radius:18px"] span[style*="font-weight:900"]');
    if (weightEvoTitle) weightEvoTitle.textContent = t('dash_weight_evo');

    var wDetailLink = document.getElementById('wGraphDetailLink');
    if (wDetailLink) wDetailLink.textContent = t('dash_global_tracking');

    var subtabs = document.querySelectorAll('#wGraphTimeframe .subtab-btn');
    if (subtabs.length >= 4) {
      subtabs[0].textContent = t('dash_tab_1m');
      subtabs[1].textContent = t('dash_tab_3m');
      subtabs[2].textContent = t('dash_tab_6m');
      subtabs[3].textContent = t('dash_tab_all');
    }

    var bpSubtabs = document.querySelectorAll('#bpGraphTimeframe .subtab-btn');
    if (bpSubtabs.length >= 4) {
      bpSubtabs[0].textContent = t('dash_tab_1m');
      bpSubtabs[1].textContent = t('dash_tab_3m');
      bpSubtabs[2].textContent = t('dash_tab_6m');
      bpSubtabs[3].textContent = t('dash_tab_all');
    }

    var logWBtn = document.querySelector('#dashLogWeightBtn span:last-child');
    if (logWBtn) logWBtn.textContent = t('dash_add_weight_btn');

    var bpEvoTitle = document.querySelector('#module-dashboard span[style*="letter-spacing:0.8px"]');
    if (bpEvoTitle) bpEvoTitle.textContent = t('dash_bp_evo');

    var bpDetail = document.getElementById('bpGraphDetailLink');
    if (bpDetail) bpDetail.textContent = t('dash_bp_details');


    // 8. Actualizar botones de categoría en biblioteca si existen
    var allCatBtn = document.querySelector('.cat-filter-btn[data-cat="all"]');
    if (allCatBtn) allCatBtn.textContent = t('cat_all');

    // 9. Refrescar listas dinámicas
    if (window.renderResearchListGlobal) {
      window.renderResearchListGlobal();
    }
    if (window.renderDashboard) {
      try { window.renderDashboard(); } catch(e) {}
    }

    // 10. Traducción automática por diccionario de todo el DOM restante
    try { translateDom(document.body); } catch(e) {}
    try { hookSwitchModule(); } catch(e) {}
  }


  // ===== DICCIONARIO DE TEXTO ESTÁTICO ES → EN (traducción automática del DOM) =====
  var DICT_ES_EN = {
  "Detalle y Amplitud de Peso": "Weight Detail & Amplitude",
  "Ventana de ±4 pesajes (hasta 9 pesajes) · Variación exacta y amplitudes": "±4 weigh-ins window (up to 9 logs) · Exact variation and amplitudes",
  "Evolución y Amplitud de Peso": "Weight Evolution & Amplitude",
  "Diferencia vs peso anterior:": "Difference vs previous weight:",
  "Diferencia vs peso anterior": "Difference vs previous weight",
  "Primer pesaje registrado": "First recorded weigh-in",
  "SELECCIONADO": "SELECTED",
  "Detalle y Amplitud de Presión": "Blood Pressure Detail & Amplitude",
  "Detalle y Amplitud de Presión Arterial": "Blood Pressure Detail & Amplitude",
  "Ventana de 5 días (±2 días) · Amplitud de rangos SYS/DIA y todas las medidas": "5-day window (±2 days) · SYS/DIA ranges amplitude and all readings",
  "Evolución y Amplitud de Rango": "Range Evolution & Amplitude",
  "Sistólica": "Systolic",
  "Diastólica": "Diastolic",
  "Amplitud del rango diario": "Daily range amplitude",
  "Amplitud:": "Amplitude:",
  "Amplitud": "Amplitude",
  "Rango Sistólica": "Systolic Range",
  "Rango Diastólica": "Diastolic Range",
  "Lectura única ese día:": "Single reading that day:",
  "MisPep": "MisPep",
  "Calculadoras Clínicas": "Clinical Calculators",
  "Panel": "Dashboard",
  "Seguimiento y Salud": "Tracking & Health",
  "Control de tratamiento, cuenta atrás de inyección y métricas corporales.": "Treatment tracking, injection countdown, and body metrics.",
  "Agenda": "Schedule",
  "Calendario y Registro": "Calendar & Daily Log",
  "Registra inyecciones, peso, estado de ánimo y presión arterial, y sigue tu progreso en un solo lugar.": "Log injections, weight, mood, and blood pressure, and track your progress in one place.",
  "Medicación": "Medication",
  "Todas las Medicaciones": "All Medications",
  "Registro completo de medicamentos y suplementos con dosis y pauta. Consúltalo en cualquier momento.": "Complete log of medications and supplements with dose and schedule. Check it anytime.",
  "Estándar": "Standard",
  "Calculadora de Péptidos": "Peptide Calculator",
  "Reconstitución de viales y cálculo exacto de unidades para inyección.": "Vial reconstitution and exact injection unit calculation.",
  "Inversa": "Reverse",
  "Reconstitución Inversa": "Reverse Reconstitution",
  "Halla cuánta agua BAC añadir para que tu dosis sea una marca limpia (ej. 10 unidades).": "Find how much BAC water to add for a clean dose mark (e.g. 10 units).",
  "Blend": "Blend",
  "Mezclas de Péptidos": "Peptide Blends",
  "Calcula mezclas combinadas en un solo vial (ej. BPC-157 + TB-500).": "Calculate combined blends in a single vial (e.g. BPC-157 + TB-500).",
  "HGH": "HGH",
  "Somatropina (HGH)": "Somatropin (HGH)",
  "Calculadora basada en Unidades Internacionales (UI / IU) y mg.": "Calculator based on International Units (IU) and mg.",
  "Nasal": "Nasal",
  "Spray Intranasal": "Intranasal Spray",
  "Cálculo de pulverizaciones para frascos con válvula dosificadora.": "Spray puff calculation for metered dose bottles.",
  "PK Model": "PK Model",
  "Nivel y Titulación": "Level & Titration",
  "Pronóstico del nivel de medicamento según historial, dosis y vida media.": "Drug level forecast based on history, dose, and half-life.",
  "Runway": "Runway",
  "Control de Reservas": "Supply Control",
  "Conoce cuántos días o semanas te durará tu inventario actual.": "Know how many days or weeks your current supply will last.",
  "Rotate": "Rotate",
  "Rotación de Inyecciones": "Injection Rotation",
  "Registra pinchazos y prevé la lipohipertrofia eligiendo el punto en reposo.": "Log injection sites and prevent lipohypertrophy by rotating.",
  "Convert": "Convert",
  "Conversor Clínico": "Clinical Converter",
  "Conversión instantánea bidireccional entre unidades de laboratorio.": "Instant bidirectional conversion between laboratory units.",
  "Inventario": "Inventory",
  "Inventario de Viales": "Vial Inventory",
  "Control de viales abiertos, dosis restantes y fecha límite de uso (28-30 días).": "Tracking of opened vials, remaining doses, and shelf-life limit (28-30 days).",
  "Label": "Label",
  "Etiquetas de Vial": "Vial Labels",
  "Diseño para impresoras térmicas (NIIMBOT, Phomemo) o impresión directa.": "Design for thermal printers (NIIMBOT, Phomemo) or direct printing.",
  "COA": "COA",
  "Verificador de Pureza": "Purity Verifier",
  "Comprobación de informes de análisis cuantitativo por HPLC y endotoxinas.": "Check quantitative HPLC analysis and endotoxin reports.",
  "Matriz": "Matrix",
  "Tabla de Referencia": "Reference Table",
  "Selecciona un compuesto para cargar sus viales habituales y pauta de titulación con el agua BAC sugerida.": "Select a compound to load typical vial sizes and titration schedules with suggested BAC water.",
  "Labs": "Labs",
  "Analíticas de Sangre": "Blood Biomarkers",
  "Supervisa biomarcadores según protocolo (GLP-1, GH o Longevidad) y guarda tus analíticas.": "Monitor biomarkers by protocol (GLP-1, GH, or Longevity) and save your lab results.",
  "Guía": "Guide",
  "Biblioteca de Péptidos": "Peptide Library",
  "Monografías de investigación con posología habitual y carga rápida en 1 clic.": "Research monographs with standard dosages and 1-click loading.",
  "Manual": "Manual",
  "Guía de Reconstitución": "Reconstitution Guide",
  "Del polvo liofilizado a la solución, paso a paso y sin dañar el péptido en el intento.": "From lyophilized powder to solution, step by step without damaging the peptide.",
  "Glosario": "Glossary",
  "Glosario de Péptidos": "Peptide Glossary",
  "Los términos que aparecen en fichas, envases y COA, explicados en castellano llano.": "Terms appearing on spec sheets, packaging, and COAs, explained clearly.",
  "Estabilidad": "Stability",
  "¿Cuánto Dura el Péptido?": "How Long Does a Peptide Last?",
  "Qué influye en su conservación y cuánto aguanta el polvo frente a la solución ya he": "What influences preservation and how long powder lasts versus reconstituted solution.",
  "Qué influye en su conservación y cuánto aguanta el polvo frente a la solución ya hecha.": "What influences preservation and how long powder lasts versus reconstituted solution.",
  "Todos los Módulos": "All Modules",
  "Panel Personal": "Personal Panel",
  "Seguimiento y Datos de Salud": "Tracking & Health Data",
  "Calendario y Registro Diario": "Calendar & Daily Log",
  "Calc (Reconstitución Estándar)": "Calc (Standard Reconstitution)",
  "Reverse (Calculadora Inversa)": "Reverse (Reverse Calculator)",
  "Blend (Mezclas Multi-péptido)": "Blend (Multi-peptide Blends)",
  "HGH (Somatropina en UI)": "HGH (Somatropin in IU)",
  "Intranasal (Spray Dosificado)": "Intranasal (Dosed Spray)",
  "Plan (Titulación y Pautas)": "Plan (Titration & Schedules)",
  "Runway (Duración de Suministro)": "Runway (Supply Duration)",
  "Rotate (Mapa de Inyecciones SubQ)": "Rotate (SubQ Injection Map)",
  "Convert (Conversor de Unidades)": "Convert (Unit Converter)",
  "Inventario (Gestión de Viales)": "Inventory (Vial Management)",
  "Label (Etiquetas para Impresora)": "Label (Printable Labels)",
  "COA (Análisis de Pureza HPLC)": "COA (HPLC Purity Test)",
  "Chart (Matriz de Referencia)": "Chart (Reference Matrix)",
  "Labs (Analíticas de Sangre)": "Labs (Blood Biomarkers)",
  "Guía (Biblioteca de Péptidos)": "Guide (Peptide Library)",
  "SEGUIMIENTO": "TRACKING",
  "PLANIFICACIÓN Y RESERVAS": "PLANNING & SUPPLY",
  "HERRAMIENTAS CLÍNICAS": "CLINICAL TOOLS",
  "EDUCACIÓN Y CONOCIMIENTO": "EDUCATION & KNOWLEDGE",
  "ANALÍTICAS Y REPORTES": "LABS & REPORTS",
  "Datos de salud": "Health Metrics",
  "Promedio semanal": "Weekly average",
  "Mejor semana": "Best week",
  "PESO ACTUAL": "CURRENT WEIGHT",
  "CAMBIO TOTAL": "TOTAL CHANGE",
  "IMC ACTUAL": "CURRENT BMI",
  "ganado": "gained",
  "perdido": "lost",
  "Evolución del Peso": "Weight Evolution",
  "Seguimiento global ›": "Global tracking ›",
  "Semana": "Week",
  "Mes": "Month",
  "Año": "Year",
  "Todo": "All",
  "Añadir nuevo peso": "Log new weight",
  "Evolución Presión Arterial": "Blood Pressure Evolution",
  "Ver detalles": "View details",
  "Sistólica": "Systolic",
  "Diastólica": "Diastolic",
  "Pulso": "Pulse",
  "En circulación ahora": "In circulation now",
  "EN CIRCULACIÓN AHORA": "IN CIRCULATION NOW",
  "Protocolos Activos": "Active Protocols",
  "días restantes": "days remaining",
  "en camino": "on track",
  "inyección": "injection",
  "días": "days",
  "💉 Vamos a poner el pinchazo": "💉 Take Injection",
  "Vamos a poner el pinchazo": "Take Injection",
  "＋ Registrar": "＋ Log",
  "Registrar Peso": "Log Weight",
  "Historial": "History",
  "Exportar informe de salud PDF": "Export health report PDF",
  "Exportar Informe PDF": "Export PDF Report",
  "Registrar Dosis Manual": "Log Manual Dose",
  "Toca o desliza sobre la gráfica para inspeccionar": "Tap or slide on chart to inspect",
  "Historial Cronológico de Entradas": "Chronological Entry History",
  "Configuración de Recordatorios de Dosis": "Dose Reminder Settings",
  "Ajustar Hora de la Inyección Semanal": "Adjust Weekly Injection Time",
  "Aviso del péptido (independiente de la medicación diaria)": "Peptide alert (independent of daily medications)",
  "Aviso de Inyección y Persistencia": "Injection Notice & Persistence",
  "Abre la app Reloj de tu móvil con esta alarma programada para que suene sin depender de MisPep en segundo plano.": "Open your phone Clock app with this scheduled alarm to ring independently of MisPep background state.",
  "Añadir Entrada Manual": "Add Manual Entry",
  "Hoy": "Today",
  "Registro diario": "Daily log",
  "Inyección administrada": "Injection administered",
  "Peso corporal (kg)": "Body weight (kg)",
  "Estado de ánimo": "Mood",
  "Excelente": "Excellent",
  "Bueno": "Good",
  "Normal": "Normal",
  "Bajo": "Low",
  "Mal": "Bad",
  "Efectos secundarios": "Side effects",
  "Náuseas": "Nausea",
  "Fatiga": "Fatigue",
  "Dolor de cabeza": "Headache",
  "Insomnio": "Insomnia",
  "Reflujo": "Reflux",
  "Estreñimiento": "Constipation",
  "Diarrea": "Diarrhea",
  "Mareo": "Dizziness",
  "Apetito reducido": "Reduced appetite",
  "Observaciones / Notas": "Observations / Notes",
  "Guardar registro diario": "Save daily log",
  "Nueva Medicación": "New Medication",
  "＋ Añadir Medicación o Suplemento": "＋ Add Medication or Supplement",
  "Nombre del fármaco o suplemento": "Medication or supplement name",
  "Categoría": "Category",
  "Dosis por toma": "Dose per intake",
  "Unidad": "Unit",
  "Frecuencia": "Frequency",
  "Diaria": "Daily",
  "Cada 2 días": "Every 2 days",
  "Cada 3 días": "Every 3 days",
  "Semanal": "Weekly",
  "Quincenal": "Every 2 weeks",
  "Mensual": "Monthly",
  "Según necesidad (PRN)": "As needed (PRN)",
  "Pauta / Instrucciones": "Instructions / Schedule",
  "ej. por la mañana en ayunas, pautado por el Dr. ...": "e.g. morning fasting, prescribed by Dr. ...",
  "✓ Guardar": "✓ Save",
  "Cancelar": "Cancel",
  "Eliminar": "Delete",
  "Editar": "Edit",
  "1. Cantidad de Péptido en el Vial": "1. Peptide Amount in Vial",
  "2. Agua Bacteriostática (BAC) añadida": "2. Bacteriostatic Water (BAC) Added",
  "3. Dosis Deseada por Inyección": "3. Target Dose per Injection",
  "Miligramos en el vial (mg)": "Milligrams in vial (mg)",
  "Volumen de agua BAC (mL)": "BAC water volume (mL)",
  "Dosis deseada": "Target dose",
  "Tipo de jeringuilla": "Syringe type",
  "Jeringa U-100 (1 mL / 100 marcas)": "U-100 Syringe (1 mL / 100 marks)",
  "Jeringa U-100 (0.5 mL / 50 marcas)": "U-100 Syringe (0.5 mL / 50 marks)",
  "Jeringa U-100 (0.3 mL / 30 marcas)": "U-100 Syringe (0.3 mL / 30 marks)",
  "Jeringa U-40 (1 mL / 40 marcas)": "U-40 Syringe (1 mL / 40 marks)",
  "Pluma precargada (clicks / marcas)": "Prefilled pen (clicks / marks)",
  "Resultado de la Reconstitución": "Reconstitution Result",
  "Concentración resultante:": "Resulting concentration:",
  "Volumen a extraer:": "Volume to draw:",
  "Marcas en la jeringuilla:": "Syringe marks:",
  "Dosis por vial:": "Doses per vial:",
  "Dosis en pluma:": "Dose in pen:",
  "Marcas en jeringuilla (unidades U-100)": "Syringe marks (U-100 units)",
  "Volumen de inyección (mL)": "Injection volume (mL)",
  "Concentración de la solución": "Solution concentration",
  "Viales necesarios para 1 mes": "Vials needed for 1 month",
  "Masa del Vial (mg)": "Vial Mass (mg)",
  "Dosis Deseada mcg mg": "Target Dose mcg mg",
  "Unidades Deseadas en Jeringa (Extracción Limpia)": "Target Syringe Units (Clean Draw)",
  "Agua BAC necesaria a añadir:": "Required BAC water to add:",
  "Concentración obtenida:": "Obtained concentration:",
  "Péptido 1 (Base de Referencia)": "Peptide 1 (Reference Base)",
  "Péptido 2": "Peptide 2",
  "Agua BAC Total en el Vial": "Total BAC Water in Vial",
  "Dosis de Péptido 1": "Peptide 1 Dose",
  "Dosis resultante de Péptido 2:": "Resulting Peptide 2 dose:",
  "Vial de HGH (UI totales)": "HGH Vial (Total IU)",
  "Agua BAC / Diluyente añadido": "BAC Water / Diluent Added",
  "Dosis Deseada": "Target Dose",
  "Conversión HGH:": "HGH Conversion:",
  "1 mg = 3.00 UI (Estándar habitual)": "1 mg = 3.00 IU (Standard)",
  "1 mg = 3.33 UI (Farmacopea europea antigua)": "1 mg = 3.33 IU (Old European Pharmacopeia)",
  "Capacidad del Frasco": "Bottle Capacity",
  "Volumen por Pulverización de la Bomba": "Spray Pump Output Volume",
  "Péptido en Polvo Disuelto": "Dissolved Peptide Powder",
  "Dosis por pulverización (spray):": "Dose per spray puff:",
  "Pulverizaciones totales en el frasco:": "Total sprays in bottle:",
  "Parámetros de Inyección del Modelo": "Model Injection Parameters",
  "Compuesto Predefinido": "Predefined Compound",
  "Parámetros de Titulación": "Titration Parameters",
  "Pronóstico de Nivel (PK)": "Level Forecast (PK)",
  "Pauta de Titulación": "Titration Schedule",
  "Vida media (horas / días)": "Half-life (hours / days)",
  "Volumen de distribución": "Volume of distribution",
  "Tasa de absorción (Ka)": "Absorption rate (Ka)",
  "Nivel sérico estimado": "Estimated serum level",
  "Concentración máxima (Cmax)": "Peak concentration (Cmax)",
  "Concentración mínima (Cmin)": "Trough concentration (Cmin)",
  "Estado estacionario": "Steady state",
  "Viales en Stock": "Vials in Stock",
  "Miligramos por Vial": "Milligrams per Vial",
  "Dosis por Toma (mg)": "Dose per Intake (mg)",
  "Duración total del suministro:": "Total supply duration:",
  "Fecha estimada de agotamiento:": "Estimated run-out date:",
  "Zona Seleccionada": "Selected Site",
  "Registrar Inyección Aquí": "Log Injection Here",
  "Abdomen superior izquierdo": "Upper left abdomen",
  "Abdomen superior derecho": "Upper right abdomen",
  "Abdomen inferior izquierdo": "Lower left abdomen",
  "Abdomen inferior derecho": "Lower right abdomen",
  "Muslo izquierdo": "Left thigh",
  "Muslo derecho": "Right thigh",
  "Brazo izquierdo (tríceps)": "Left arm (triceps)",
  "Brazo derecho (tríceps)": "Right arm (triceps)",
  "Glúteo superior izquierdo": "Upper left glute",
  "Glúteo superior derecho": "Upper right glute",
  "Microgramos (mcg) ↔ Miligramos (mg)": "Micrograms (mcg) ↔ Milligrams (mg)",
  "Mililitros (mL) ↔ Unidades U-100": "Milliliters (mL) ↔ U-100 Units",
  "HGH: Miligramos (mg) ↔ Unidades (UI)": "HGH: Milligrams (mg) ↔ Units (IU)",
  "Nuevo Vial Reconstituido": "New Reconstituted Vial",
  "+ Añadir Vial Reconstituido": "+ Add Reconstituted Vial",
  "Nombre del péptido": "Peptide name",
  "Cantidad en el vial (mg)": "Quantity in vial (mg)",
  "Volumen de diluyente añadido (mL)": "Diluent volume added (mL)",
  "Fecha de reconstitución": "Reconstitution date",
  "Dosis estándar habitual": "Standard regular dose",
  "Lote o fabricante": "Batch or manufacturer",
  "✓ Guardar en Inventario": "✓ Save to Inventory",
  "Viales Reconstituidos Activos": "Active Reconstituted Vials",
  "Dosis restantes": "Remaining doses",
  "Días desde reconstitución": "Days since reconstitution",
  "Caducidad recomendada (28 días)": "Recommended shelf life (28 days)",
  "Datos del Vial": "Vial Data",
  "Nombre / Compuesto": "Name / Compound",
  "Concentración (mg/mL)": "Concentration (mg/mL)",
  "Fecha Reconstitución": "Reconstitution Date",
  "Dosis habitual": "Typical Dose",
  "Diluyente utilizado": "Diluent Used",
  "💾 Guardar Etiqueta PNG en Galería": "💾 Save PNG Label to Gallery",
  "🖨️ Compartir / Enviar a Impresora": "🖨️ Share / Send to Printer",
  "Masa Declarada en Etiqueta (mg)": "Label Stated Mass (mg)",
  "Masa Real Detectada en Laboratorio (mg)": "Actual Lab Measured Mass (mg)",
  "Pureza HPLC (%)": "HPLC Purity (%)",
  "Desviación de contenido:": "Content deviation:",
  "Veredicto del lote:": "Batch verdict:",
  "Excelente calidad": "Excellent quality",
  "Conforme a especificaciones": "Within specifications",
  "Subdosificado o impuro": "Underdosed or impure",
  "Seleccionar Péptido": "Select Peptide",
  "Más fácil de leer": "Easiest to read",
  "Menor volumen": "Lowest volume",
  "Tabla de dilución recomendada": "Recommended dilution table",
  "Selecciona el Panel de Análisis": "Select Lab Panel",
  "Marcadores Clínicos": "Clinical Markers",
  "Historial de Analíticas Recientes": "Recent Lab History",
  "Panel Metabólico / GLP-1": "Metabolic / GLP-1 Panel",
  "Panel Eje Hormona Crecimiento": "Growth Hormone Axis Panel",
  "Panel Longevidad y Envejecimiento": "Longevity & Aging Panel",
  "Panel Renal y Hepático": "Kidney & Liver Panel",
  "Glucosa en ayunas": "Fasting glucose",
  "HbA1c (Hemoglobina glicada)": "HbA1c (Glycated hemoglobin)",
  "Insulina en ayunas": "Fasting insulin",
  "HOMA-IR": "HOMA-IR",
  "Colesterol total": "Total cholesterol",
  "HDL colesterol": "HDL cholesterol",
  "LDL colesterol": "LDL cholesterol",
  "Triglicéridos": "Triglycerides",
  "ALT (GPT)": "ALT (GPT)",
  "AST (GOT)": "AST (GOT)",
  "GGT": "GGT",
  "Creatinina": "Creatinine",
  "eGFR (Filtrado glomerular)": "eGFR (Glomerular filtration rate)",
  "Ácido úrico": "Uric acid",
  "IGF-1 (Somatomedina C)": "IGF-1 (Somatomedin C)",
  "Proteína C Reactiva ultrasensible (PCR-us)": "hs-CRP (high-sensitivity C-reactive protein)",
  "TSH (Tirotropina)": "TSH (Thyrotropin)",
  "💾 Guardar Analítica en Historial": "💾 Save Lab Test to History",
  "Añadir dosis": "Add Dose",
  "Medicamento": "Medication",
  "Fecha y hora": "Date & Time",
  "Dosis (mg)": "Dose (mg)",
  "Zona de inyección": "Injection Site",
  "Vial actual": "Current Vial",
  "Agua BAC": "BAC Water",
  "Jeringuilla": "Syringe",
  "Pluma": "Pen",
  "Marcar como administrada": "Mark as Administered",
  "Medicamentos activos": "Active Medications",
  "Historial y Registros de Peso": "Weight History & Logs",
  "Registrar Entrada": "Log Entry",
  "Tensión Arterial": "Blood Pressure",
  "Sistólica (mmHg)": "Systolic (mmHg)",
  "Diastólica (mmHg)": "Diastolic (mmHg)",
  "Pulso (ppm)": "Pulse (bpm)",
  "Guardar medición": "Save measurement",
  "Aviso de Batería": "Battery Notice",
  "Entendido": "Understood",
  "Optimización de Batería en Segundo Plano": "Background Battery Optimization",
  "Copia de Seguridad y Privacidad": "Backup & Privacy",
  "Descargar Copia JSON": "Download JSON Backup",
  "Restaurar Copia JSON": "Restore JSON Backup",
  "Borrar Todos los Datos": "Erase All Data",
  "Lunes": "Monday",
  "Martes": "Tuesday",
  "Miércoles": "Wednesday",
  "Jueves": "Thursday",
  "Viernes": "Friday",
  "Sábado": "Saturday",
  "Domingo": "Sunday",
  "Enero": "January",
  "Febrero": "February",
  "Marzo": "March",
  "Abril": "April",
  "Mayo": "May",
  "Junio": "June",
  "Julio": "July",
  "Agosto": "August",
  "Septiembre": "September",
  "Octubre": "October",
  "Noviembre": "November",
  "Diciembre": "December",
  "Lun": "Mon",
  "Mar": "Tue",
  "Mié": "Wed",
  "Jue": "Thu",
  "Vie": "Fri",
  "Sáb": "Sat",
  "Dom": "Sun",
  "Ene": "Jan",
  "Feb": "Feb",
  "Abr": "Apr",
  "May": "May",
  "Jun": "Jun",
  "Jul": "Jul",
  "Ago": "Aug",
  "Sep": "Sep",
  "Oct": "Oct",
  "Nov": "Nov",
  "Dic": "Dec",
  "Todos": "All",
  "Metabolismo": "Metabolism",
  "Reparación": "Repair",
  "Eje GH": "GH Axis",
  "Longevidad": "Longevity",
  "Cognición": "Cognition",
  "Inmunidad": "Immunity",
  "Sexual": "Sexual Health",
  "⚡ Cargar Parámetros en Calculadora": "⚡ Load Parameters in Calculator",
  "📊 Simulador PK": "📊 PK Simulator",
  "＋ Añadir a Medicamentos": "＋ Add to Medications",
  "✓ En la lista de medicamentos": "✓ In Medications List",
  "No se encontraron péptidos para la búsqueda o categoría seleccionada.": "No peptides found for the selected search or category.",
  "Buscar por nombre, categoría o indicación...": "Search by name, category, or indication...",
  "Buscar péptido...": "Search peptide...",
  "Añadir notas aquí...": "Add notes here...",
  "Observaciones o síntomas...": "Observations or symptoms...",
  "Guardar": "Save",
  "Aceptar": "OK",
  "Sí": "Yes",
  "No": "No",
  "(opcional)": "(optional)",
  "\"Sin restricciones\"": "\"Unrestricted\"",
  "(no se borran al desinstalar):": "(not erased upon uninstall):",
  ") — se reescribe la más antigua": ") — oldest is rewritten",
  ") — solo se renueva cada 7 días": ") — renewed every 7 days",
  ", no horas.": ", not hours.",
  "0 (Ninguno)": "0 (None)",
  "1 copia semanal": "1 weekly backup",
  "1 mes": "1 month",
  "3 meses": "3 months",
  "6 meses": "6 months",
  "1 vez al mes": "Once a month",
  "1 vez por semana": "Once a week",
  "1. Grupo terapéutico o indicación": "1. Therapeutic group or indication",
  "1.5 mg · 30 marcas (unidades U-100) · Retatrutide": "1.5 mg · 30 marks (U-100 units) · Retatrutide",
  "10 (Intenso)": "10 (Severe)",
  "117% del pico de una sola dosis": "117% of single dose peak",
  "119 días": "119 days",
  "12 a 24 meses": "12 to 24 months",
  "12-24 meses": "12-24 months",
  "140 días": "140 days",
  "2 semanas": "2 weeks",
  "2. Medicamento": "2. Medication",
  "20 dosis": "20 doses",
  ": la agitación rompe la estructura del péptido.": ": shaking damages peptide structure.",
  ": lo que no vayas a usar en su ventana, déjalo en polvo.": ": what you will not use within its window, keep as powder.",
  ": ni luz directa ni en el parasol del coche.": ": neither direct light nor in car visor.",
  "Abdomen - Superior izquierdo": "Abdomen - Upper left",
  "Abdomen - Superior derecho": "Abdomen - Upper right",
  "Abdomen - Inferior izquierdo": "Abdomen - Lower left",
  "Abdomen - Inferior derecho": "Abdomen - Lower right",
  "Muslo - Izquierdo": "Thigh - Left",
  "Muslo - Derecho": "Thigh - Right",
  "Brazo - Izquierdo": "Arm - Left",
  "Brazo - Derecho": "Arm - Right",
  "Glúteo - Izquierdo": "Glute - Left",
  "Glúteo - Derecho": "Glute - Right",
  "Absorbiéndose desde el tejido subcutáneo. Apenas se nota aún.": "Absorbing from subcutaneous depot. Barely noticeable yet.",
  "Ahora mismo · 8.9 h desde tu última dosis": "Right now · 8.9 h since your last dose",
  "Anota la fecha de reconstitución": "Note the reconstitution date",
  "Añade 2.00 mL de agua BAC al vial.": "Add 2.00 mL of BAC water to the vial.",
  "Añade, edita la fecha o el peso de cualquier registro anterior, o ajusta tu estatura para el IMC.": "Add, edit date or weight of any past entry, or adjust height for BMI.",
  "Añade, edita la fecha o los valores de cualquier registro anterior.": "Add, edit date or readings of any past record.",
  "Añadir medicamento...": "Add medication...",
  "Añadir suplemento...": "Add supplement...",
  "Aplica calor suave (paño templado) 10-15 min antes en la zona para relajar el tejido y dilatar capilares; absorción más cómoda.": "Apply gentle heat (warm cloth) 10-15 min prior to relax tissue and dilate capillaries; smoother absorption.",
  "Asegúrate de que el líquido está a temperatura ambiente antes de inyectar; el frío directo escuece.": "Ensure liquid is at room temp before injecting; cold liquid stings.",
  "Aspirar antes de inyectar no es necesario en vía subcutánea según las guías clínicas actuales.": "Aspirating before injecting is not necessary for subcutaneous route per current clinical guidelines.",
  "Atenuándose. Nivel residual en sangre; descenso progresivo hasta la siguiente toma.": "Tapering down. Residual serum level; steady decline until next intake.",
  "Bienestar general (1 a 10):": "General well-being (1 to 10):",
  "Cada 2 semanas": "Every 2 weeks",
  "Cada 3-4 semanas": "Every 3-4 weeks",
  "Cambiar medicamento activo": "Change active medication",
  "Capacidad de la jeringuilla": "Syringe capacity",
  "Cargando analíticas...": "Loading lab tests...",
  "Cargando historial...": "Loading history...",
  "Cargando inventario...": "Loading inventory...",
  "Cargando medicamentos...": "Loading medications...",
  "Categoría del compuesto": "Compound category",
  "Concentración final": "Final concentration",
  "Confirmar eliminación": "Confirm deletion",
  "Copia de seguridad local": "Local backup",
  "De vuelta al frío en cuanto terminas de manipular:": "Return to cold immediately after handling:",
  "Descartar vial": "Discard vial",
  "Desde el último registro:": "Since last entry:",
  "Detalle de la dosis": "Dose detail",
  "Días en camino": "Days on track",
  "Días transcurridos": "Days elapsed",
  "Dosis actual": "Current dose",
  "Dosis administrada con éxito": "Dose logged successfully",
  "Dosis calculada": "Calculated dose",
  "Dosis en marcas": "Dose in marks",
  "Dosis en mL": "Dose in mL",
  "Dosis prescrita": "Prescribed dose",
  "Dosis restante en el vial": "Remaining dose in vial",
  "Dosis sugerida": "Suggested dose",
  "Editar entrada": "Edit entry",
  "Editar medicamento": "Edit medication",
  "Editar perfil de salud": "Edit health profile",
  "Efecto máximo (pico sérico). Mayor probabilidad de notar efectos terapéuticos y secundarios.": "Peak effect (serum peak). Highest probability of noticing therapeutic and side effects.",
  "Estatura (cm)": "Height (cm)",
  "Estatura actualizada": "Height updated",
  "Evolución de biomarcadores": "Biomarker evolution",
  "Fecha de apertura": "Opening date",
  "Fecha de inicio del tratamiento": "Treatment start date",
  "Fecha de la inyección": "Injection date",
  "Fecha y hora de la dosis": "Dose date and time",
  "Formato de exportación": "Export format",
  "Generar informe": "Generate report",
  "Guardado correctamente": "Saved successfully",
  "Guarda el vial": "Store the vial",
  "Historial de inyecciones": "Injection history",
  "Historial de pesajes": "Weight log history",
  "Hora habitual": "Usual time",
  "Información del lote": "Lot information",
  "Inyección semanal": "Weekly injection",
  "Inyecciones registradas": "Logged injections",
  "Marca en jeringa": "Syringe mark",
  "Masa en circulación": "Circulating mass",
  "Medicamento activo": "Active medication",
  "Medicación actualizada": "Medication updated",
  "Medicación eliminada": "Medication deleted",
  "Medicación guardada": "Medication saved",
  "Medicación pautada": "Prescribed medication",
  "Modo oscuro / claro": "Dark / light mode",
  "Nivel actual en sangre": "Current blood level",
  "Nivel estimado": "Estimated level",
  "Nivel máximo alcanzado": "Maximum level reached",
  "Nivel residual": "Trough level",
  "No agites": "Do not shake",
  "No hay entradas registradas": "No entries logged",
  "No hay medicamentos registrados": "No medications logged",
  "No hay viales en inventario": "No vials in inventory",
  "Notas del registro": "Log notes",
  "Notificación programada": "Scheduled notification",
  "Número de inyección": "Injection number",
  "Pauta recomendada": "Recommended protocol",
  "Pellizca suavemente la piel en ángulo de 45° a 90° según la aguja (4-8 mm) para asegurar el plano subcutáneo.": "Gently pinch skin at 45° to 90° angle based on needle (4-8 mm) to ensure subcutaneous plane.",
  "Peso corporal": "Body weight",
  "Peso inicial": "Starting weight",
  "Peso objetivo": "Target weight",
  "Peso registrado": "Weight logged",
  "Plan de titulación": "Titration plan",
  "Presión arterial guardada": "Blood pressure saved",
  "Próxima dosis": "Next dose",
  "Próxima inyección en:": "Next injection in:",
  "Punto de inyección": "Injection site",
  "Reconstituir": "Reconstitute",
  "Reconstituye": "Reconstitute",
  "Registro completado": "Record completed",
  "Registro de inyección": "Injection log",
  "Registro eliminado": "Entry deleted",
  "Rotación recomendada": "Recommended rotation",
  "Semana de tratamiento": "Treatment week",
  "Semivida estimada": "Estimated half-life",
  "Siguiente inyección": "Next injection",
  "Sin registros todavía": "No records yet",
  "Subiendo hacia el pico. Inicio de efectos principales.": "Rising toward peak. Onset of primary effects.",
  "Tapón con": "Stopper with",
  "Tiempo hasta el pico (Tmax)": "Time to peak (Tmax)",
  "Titulación progresiva": "Gradual titration",
  "Total inyecciones": "Total injections",
  "Total viales": "Total vials",
  "Última inyección": "Last injection",
  "Último registro": "Last entry",
  "Unidades U-100": "U-100 Units",
  "Usa aguja fina (30G o 31G) para minimizar molestias; las de 8 mm van bien en abdomen y las de 6 mm en muslo.": "Use fine needle (30G or 31G) to minimize discomfort; 8 mm works well for abdomen and 6 mm for thigh.",
  "Vial activo": "Active vial",
  "Vial agotado": "Vial exhausted",
  "Vial reconstituido": "Reconstituted vial",
  "Vida útil recomendada": "Recommended shelf life",
  "Volumen de agua": "Water volume",
  "Volumen por dosis": "Volume per dose",
  "Zona recomendada": "Recommended site",
  "3 copias de cambios": "3 change backups",
  "3. Dosis": "3. Dose",
  "4-8 sem (máx. ~3 meses)": "4-8 wks (max ~3 mos)",
  "4. Pauta": "4. Schedule",
  "4. Tipo de Jeringa": "4. Syringe Type",
  "5 (Moderado)": "5 (Moderate)",
  "5 dosis": "5 doses",
  "5 días": "5 days",
  "5. Nota (opcional)": "5. Note (optional)",
  "50 mg total": "50 mg total",
  "6 días": "6 days",
  "7 días": "7 days",
  "aguanta días protegido": "withstands days protected",
  "Añadir medicación": "Add medication",
  "Añadir suplemento": "Add supplement",
  "Añadir registro": "Add entry",
  "Añadir analítica": "Add lab test",
  "Añadir vial": "Add vial",
  "Añadir peso": "Add weight",
  "Ajustes de altura": "Height settings",
  "Ajustes de dosis": "Dose settings",
  "Ajustes": "Settings",
  "Cerrar menú": "Close menu",
  "Cambiar tema": "Toggle theme",
  "Cerrar": "Close",
  "Guardar cambios": "Save changes",
  "horas a pocos días": "hours to few days",
  "meses (ideal al congelador)": "months (ideally freezer)",
  "Polvo · congelador": "Powder · freezer",
  "Polvo · frigorífico": "Powder · fridge",
  "Polvo · en tránsito": "Powder · in transit",
  "Solución · frigorífico": "Solution · fridge",
  "Solución · ambiente": "Solution · room temp",
  "Restaurar copia": "Restore backup",
  "Descargar copia": "Download backup",
  "Generar etiqueta": "Generate label",
  "Imprimir etiqueta": "Print label",
  "Ver historial": "View history",
  "Ver pauta": "View schedule",
  "Seleccionar zona": "Select site",
  "Seleccionar jeringa": "Select syringe",
  "Seleccionar pluma": "Select pen",
  "Seleccionar fecha": "Select date",
  "Seleccionar hora": "Select time",
  "Sin efectos secundarios": "No side effects",
  "Sin observaciones": "No observations",
  "Sin medicaciones": "No medications",
  "Sin registros": "No records",
  "Sin viales": "No vials",
  "8 días": "8 days",
  "90 días": "90 days",
  "En todo el periodo": "All time",
  "Restaurar Copia de Seguridad (JSON)": "Restore Backup (JSON)",
  "Restaurar copia de seguridad": "Restore backup",
  "Persistencia y Avisos (9:00 AM)": "Persistence & Alerts (9:00 AM)",
  "Persistencia y Avisos": "Persistence and Alerts",
  "Persistencia y avisos": "Persistence and alerts",
  "Quiero ayudar al programador": "Support the Developer",
  "Apoyo y Desarrollo": "Support & Development",
  "Apoyo al desarrollo de MisPep": "Support MisPep development",
  "Si MisPep te es de ayuda y quieres apoyar su mantenimiento, puedes enviar una propina en criptomonedas. Toca cualquier opción para abrir tu cartera por defecto o copiar la dirección:": "If MisPep is helpful to you and you want to support its maintenance, you can send a tip in cryptocurrency. Tap any option to open your default wallet or copy the address:",
  "Red principal (On-Chain)": "Mainnet (On-Chain)",
  "Pagos instantáneos Layer 2": "Instant Layer 2 Payments",
  "Red principal Litecoin": "Mainnet Litecoin",
  "🚀 Abrir cartera": "🚀 Open wallet",
  "Abrir cartera": "Open wallet",
  "Copiar dirección": "Copy address",
  "Copiar factura / clave": "Copy invoice / key",
  "Sin datos": "No data",
  "Sin registros de presión arterial": "No blood pressure records",
  "Sin registros para mostrar medicación": "No records to show medication",
  "Sin dosis programada": "No scheduled dose",
  "Configura altura y peso": "Set up height & weight",
  "Sin registros de peso": "No weight logs",
  "0.0% del peso inicial": "0.0% of initial weight",
  "sin cambio": "same",
  "¡Bienvenido a MisPep! Configura tu tratamiento.": "Welcome to MisPep! Configure your treatment.",
  "Sin medicación antihipertensiva añadida. Pulsa \"＋ Añadir Fármaco\" para incluir uno.": "No antihypertensive medication added. Tap \"＋ Add Medication\" to include one.",
  "Misma pauta": "Same schedule",
  "⚠️ IMPORTANTE PARA ANDROID:": "⚠️ IMPORTANT FOR ANDROID:",
  "sobre(s)": "sachet(s)",
  "Fecha": "Date",

  "Solo si es necesario (a demanda)": "Only if needed (as needed)",
  "Añadir": "Add",
  "Añade": "Add",
  "Total Peptide": "Total Peptide",

  "🛡️ \n          Se guardan solas en  (no se borran al desinstalar):\n          •  en rotación () — se reescribe la más antigua\n          •  () — solo se renueva cada 7 días": "🛡️ \n          They are saved automatically in  (not erased upon uninstall):\n          •  in rotation () — oldest is rewritten\n          •  () — renewed every 7 days",
  "Optimización de batería: permite a MisPep ejecutarse en segundo plano.": "Battery optimization: allow MisPep to run in the background.",
  "General": "General",
  "Dosis": "Dose",
  "Total": "Total",
  "Muslo": "Thigh",
  "vida media": "half-life",
  "Dosis por Vial": "Dose per Vial",
  "Dosis por Spray": "Dose per Spray",
  "Dosis Administrada (mg)": "Administered Dose (mg)",
  "Dosis Inicial (mg)": "Starting Dose (mg)",
  "Dosis Recibida P1": "Dose Received P1",
  "Dosis Recibida P2": "Dose Received P2",
  "Dosis Totales": "Total Doses",
  "Dosis activa": "Active dose",
  "Masa Total (mg)": "Total Mass (mg)",
  "Nivel de Endotoxinas (EU/mg)": "Endotoxin Level (EU/mg)",
  "Peso (kg)": "Weight (lb)",
  "● Peso (kg)": "● Weight (lb)",
  "Evolución y Variación de Peso": "Weight Evolution & Variation",
  "Evolución y variación de peso": "Weight evolution & variation",
  "EVOLUCIÓN Y VARIACIÓN DE PESO": "WEIGHT EVOLUTION & VARIATION",
  "Detalle de cada pesaje (±4 registros)": "Details of each weigh-in (±4 records)",
  "📋 Detalle de cada pesaje (±4 registros)": "📋 Details of each weigh-in (±4 records)",
  "Peso de Inicio (kg)": "Starting Weight (lb)",
  "Semanas por Nivel": "Weeks per Level",
  "Suministro de medicamento": "Medication supply",
  "HGH Vial (Total IU)": "HGH Vial (Total IU)",
  "Vial \\ Dosis": "Vial \\ Dose",
  "Miércoles · 2 mg": "Wednesday · 2 mg",
  "Próxima inyección": "Next injection",
  "Usada hace poco": "Recently used",
  "Copias automáticas activas": "Automatic backups active",
  "⏳ Vida media:": "⏳ Half-life:",
  "⚖️ Peso": "⚖️ Weight",
  "＋ Nuevo Peso": "＋ New Weight",
  "🔔 Activar Recordatorio de Dosis": "🔔 Enable Dose Reminder",
  "💉 Registrar Inyección Hoy": "💉 Log Injection Today",
  "✓ Guardar Altura, Peso Inicial y Meta": "✓ Save Height, Starting Weight & Goal",
  "Tu reserva durará  (20 dosis en total). Se agotará el .": "Your supply will last (20 doses in total). It will run out on .",
  "Añade  de agua BAC al vial de 5 mg. Así, cada  equivaldrán exactamente a tu dosis de .": "Add BAC water to the 5 mg vial. That way, each will equal exactly your dose of .",
  "⏰  el día que corresponda tu próxima inyección de péptidos para recordártelo puntualmente.": "⏰ on the day of your next peptide injection to remind you on time.",
  "BPC-157 (~4 horas vida media)": "BPC-157 (~4-hour half-life)",
  "BPC-157 (Semivida corta ~4 horas)": "BPC-157 (short half-life ~4 hours)",
  "TB-500 (~24 horas vida media)": "TB-500 (~24-hour half-life)",
  "Tesamorelina (~2 horas vida media)": "Tesamorelin (~2-hour half-life)",
  "10. Colesterol Total": "10. Total Cholesterol",
  "Nivel de Endotoxinas": "Endotoxin Level",
  "U-100 (1 mL / 100 unidades)": "U-100 (1 mL / 100 units)",
  "U-50 (0.5 mL / 50 unidades)": "U-50 (0.5 mL / 50 units)",
  "U-30 (0.3 mL / 30 unidades)": "U-30 (0.3 mL / 30 units)",
  "U-40 (1 mL / 40 unidades)": "U-40 (1 mL / 40 units)",
  "unidades": "units",
  "cápsula(s)": "capsule(s)",
  "Diario (todos los días)": "Daily (every day)",
  "todos los días": "every day",
  "Días por semana": "Days per week",
  "días/semana": "days/week",
  "2 días/semana": "2 days/week",
  "Días alternos (uno sí, uno no)": "Alternate days (one on, one off)",
  "Cada 15 días": "Every 15 days",
  "Cada 7 días (Semanal)": "Every 7 days (Weekly)",
  "Cada 3.5 días (2 veces por semana)": "Every 3.5 days (twice weekly)",
  "Frecuencia (cada N días)": "Frequency (every N days)",
  "Frecuencia (días)": "Frequency (days)",
  "Frecuencia de Inyección (Intervalo en Días)": "Injection Frequency (Interval in Days)",
  "Duración Total (Semanas)": "Total Duration (Weeks)",
  "Semivida (días)": "Half-life (days)",
  "No establecida (preclínico)": "Not established (preclinical)",
  "Subcutánea": "Subcutaneous",
  "Glúteo": "Glute",
  "Músculo": "Muscle",
  "Músculo (IM)": "Muscle (IM)",
  "6 a 8 días": "6 to 8 days",
  "1 vez al día en ciclos de 4 a 8 semanas": "Once daily in 4 to 8 week cycles",
  "1 a 2 veces al día antes de dormir (SubQ)": "1 to 2 times daily before bed (SubQ)",
  "Telmisartán": "Telmisartan",
  "Telmisartán (23:36)": "Telmisartan (23:36)",
  "💧 Diuréticos": "💧 Diuretics",
  "🍬 Antidiabéticos": "🍬 Antidiabetics",
  "🔥 Protectores gástricos (IBP)": "🔥 Gastric protectors (PPIs)",
  "Protectores gástricos (IBP)": "Gastric protectors (PPIs)",
  "💊 Analgésicos y Antiinflamatorios": "💊 Analgesics & Anti-inflammatories",
  "🤧 Antihistamínicos / Alergias": "🤧 Antihistamines / Allergies",
  "🧠 Antidepresivos y Ansiolíticos": "🧠 Antidepressants & Anxiolytics",
  "⚡ Neurología / Anticonvulsivos": "⚡ Neurology / Anticonvulsants",
  "🚹 Urología / Próstata": "🚹 Urology / Prostate",
  "Urología / Próstata": "Urology / Prostate",
  "🦴 Salud ósea": "🦴 Bone health",
  "🦠 Antibióticos": "🦠 Antibiotics",
  "🧫 Antifúngicos y Antivirales": "🧫 Antifungals & Antivirals",
  "🧠 Salud mental / Antipsicóticos": "🧠 Mental health / Antipsychotics",
  "💉 Péptidos y Tratamiento Inyectable": "💉 Peptides & Injectable Therapy",
  "🏠 Cardiología / Tensión": "🏠 Cardiology / Blood pressure",
  "Cardiología / Tensión": "Cardiology / Blood pressure",
  "Visualización de la Jeringa": "Syringe View",
  "Visualización del Pen (Pluma Dosificadora)": "Pen View (Dosing Pen)",
  "Agua BAC a Añadir": "BAC Water to Add",
  "Agua BAC añadida (mL)": "BAC water added (mL)",
  "Agua BAC en vial (mL)": "BAC water in vial (mL)",
  "Agua BAC Total en el Vial": "Total BAC Water in Vial",
  "Dosis Deseada del Péptido 1": "Target Peptide 1 Dose",
  "Dosis Deseada por Aplicación": "Target Dose per Application",
  "Dosis Próxima (mg)": "Next Dose (mg)",
  "Extracción de la Mezcla": "Blend Draw",
  "Extracción en Jeringa U-100": "U-100 Syringe Draw",
  "Extracción en la jeringuilla": "Syringe draw",
  "Conversión Estándar (UI por mg)": "Standard Conversion (IU per mg)",
  "El estándar en la mayoría de frascos es 0.10 mL (100 µL).": "The standard in most bottles is 0.10 mL (100 µL).",
  "Con 2 pulverización(es) recibes  (aprox. 1.0 en cada fosa nasal).": "With 2 spray(s) you get (approx. 1.0 per nostril).",
  "Calcula mezclas combinadas en un solo vial (ej. BPC-157 + TB-500).": "Calculate combined blends in a single vial (e.g. BPC-157 + TB-500).",
  "Frecuencia Cardíaca (ppm / BPM)": "Heart Rate (bpm / BPM)",
  "Presión Arterial y Pulso": "Blood Pressure & Pulse",
  "Concentración": "Concentration",
  "Frecuencia": "Frequency",
  "Desviación Masa": "Mass Deviation",
  "Estándar seguro USP: menos de 0.05 EU/mg.": "Safe USP standard: less than 0.05 EU/mg.",
  "Modo de Extracción": "Draw Mode",
  "Genérico en Miligramos (mg)": "Generic in Milligrams (mg)",
  "Genérico en Microgramos (mcg)": "Generic in Micrograms (mcg)",
  "📈 Pronóstico de Nivel (PK)": "📈 Level Forecast (PK)",
  "📅 Pauta de Titulación": "📅 Titration Schedule",
  "Pronóstico del nivel de medicamento": "Drug level forecast",
  "Pronóstico del Nivel en Organismo": "Body Level Forecast",
  "Modelo Farmacocinético": "Pharmacokinetic Model",
  "Modelo de persistencia equivalente a dosis basado en las dosis registradas y la vida media — no es una cantidad en el torrente sanguíneo ni una medición clínica.": "Dose-equivalent persistence model based on logged doses and half-life — it is not an amount in the bloodstream nor a clinical measurement.",
  "Persistencia equivalente a dosis estimada a partir de tu historial y la vida media del medicamento.": "Dose-equivalent persistence estimated from your history and the drug half-life.",
  "Retatrutida (~6 días vida media)": "Retatrutide (~6-day half-life)",
  "Tirzepatida (~5 días vida media)": "Tirzepatide (~5-day half-life)",
  "Semaglutida (~7 días vida media)": "Semaglutide (~7-day half-life)",
  "Cagrilintida (~7 días vida media)": "Cagrilintide (~7-day half-life)",
  "Retatrutida (Semivida ~6 días)": "Retatrutide (half-life ~6 days)",
  "Tirzepatida (Semivida ~5 días)": "Tirzepatide (half-life ~5 days)",
  "Semaglutida (Semivida ~7 días)": "Semaglutide (half-life ~7 days)",
  "Estimado en la fecha seleccionada": "Estimated on the selected date",
  "Previsión": "Forecast",
  "Cronograma del Protocolo": "Protocol Timeline",
  "Duración Estimada": "Estimated Duration",
  "Péptido Total": "Total Peptide",
  "Última vez inyectado:": "Last injected:",
  "Frecuencia Cardíaca": "Heart Rate",
  "Pico de concentración": "Concentration peak",
  "próximo en": "next in",
  "Pico máximo activo": "Peak active level",
  "Concentración plasmática máxima. Mayor efecto en saciedad y supresión del apetito.": "Maximum plasma concentration. Strongest effect on satiety and appetite suppression.",
  "Comenzará el declive metabólico gradual en ~24 h.": "Gradual metabolic decline will begin in ~24 h.",
  "📍 Última dosis:": "📍 Last dose:",
  "Hace 1 días · Abdomen - Superior derecho · Dosis planificada": "1 days ago · Abdomen - Upper right · Planned dose",
  "Esta fue una dosis planificada": "This was a planned dose",
  "Registrar como dosis omitida": "Log as skipped dose",
  "Más fármaco": "More drug",
  "Menos fármaco": "Less drug",
  "Rango sistólica": "Systolic range",
  "Rango diastólica": "Diastolic range",
  "Última medida:  /  mmHg · Pulso:": "Last reading: / mmHg · Pulse:",
  "[Última medida]": "[Last reading]",
  "💊 Medicación tomada ese día:": "💊 Medication taken that day:",
  "✏️ Modificar toma y medicación": "✏️ Edit dose & medication",
  "↔️ Misma medicación tomada el día anterior (2026-10-07) · ⏰ Toma habitual:": "↔️ Same medication taken the previous day (2026-10-07) · ⏰ Usual time:",
  "Añadir nueva tensión arterial": "Add new blood pressure",
  "Controla cuánto medicamento te queda en reserva.": "Track how much medication you have left in reserve.",
  "Configura tu meta para ver el progreso.": "Set your goal to see progress.",
  "Cuenta atrás y recordatorios": "Countdown & reminders",
  "Planificación y recordatorios": "Planning & reminders",
  "Planificación y Reservas": "Planning & Supply",
  "Herramientas Clínicas": "Clinical Tools",
  "Pierde 2 kg para llegar a Sobrepeso": "Lose 2 kg to reach Overweight",
  "Estado de Ánimo": "Mood",
  "Controlado sin antojos": "In control, no cravings",
  "Bajo de energía 🌧️": "Low energy 🌧️",
  "¿Cómo te sientes?": "How do you feel?",
  "Toca para añadir estado de ánimo, apetito y dolor": "Tap to add mood, appetite and pain",
  "Meta de peso (kg)": "Weight goal (kg)",
  "Parámetros Clínicos para IMC": "Clinical Parameters for BMI",
  "Añadir o Editar Pesaje": "Add or Edit Weight Entry",
  "Fecha del Pesaje": "Weight Entry Date",
  "⌚ Importar pesajes de la báscula (Health Connect)": "⌚ Import scale readings (Health Connect)",
  "⌚ Sincronizar datos de Health Connect": "⌚ Sync Health Connect data",
  "⌚ Conectar con Health Connect": "⌚ Connect with Health Connect",
  "Importar datos de Health Connect": "Import Health Connect data",
  "📖 Ficha de escuela": "📖 School sheet",
  "datos, mecanismo y evidencia": "data, mechanism & evidence",
  "Qué dice la evidencia": "What the evidence says",
  "Puntos clave": "Key points",
  "Preguntas frecuentes": "Frequently asked questions",
  "Health Connect al día: Sin pesajes ni mediciones de tensión nuevas": "Health Connect up to date: No new weight or blood pressure logs",
  "Health Connect no tiene mediciones de tensión nuevas": "Health Connect has no new blood pressure readings",
  "Health Connect no tiene pesajes nuevos": "Health Connect has no new weight logs",
  "Sin mediciones de tensión nuevas": "No new blood pressure readings",
  "Sin pesajes nuevos": "No new weight logs",
  "Health Connect: Falta activar permiso de Tensión arterial": "Health Connect: Blood pressure permission needed in settings",
  "Concede el acceso para leer tus datos de salud": "Grant access to read your health data",
  "Health Connect no está disponible en este móvil": "Health Connect is not available on this device",
  "🎯 Meta de peso y evolución": "🎯 Weight goal & progress",
  "Registro de Peso": "Weight Entry",
  "📋 Cronología": "📋 Timeline",
  "📋 Todos los Registros": "📋 All Records",
  "😊 Ánimo": "😊 Mood",
  "❤️ Presión PA": "❤️ BP Pressure",
  "Añadir inyección": "Add injection",
  "Registra inyecciones GLP-1 y péptidos": "Log GLP-1 and peptide injections",
  "Registrar peso": "Log weight",
  "Vientre, cadera, brazos y más": "Belly, hips, arms and more",
  "Registrar ánimo": "Log mood",
  "Registra ánimo, apetito y energía": "Log mood, appetite and energy",
  "Presión arterial": "Blood pressure",
  "Registra PA y frecuencia cardíaca": "Log BP and heart rate",
  "✓ Guardar Presión Arterial": "✓ Save Blood Pressure",
  "Añadir Entrada Manual": "Add Manual Entry",
  "⏰ Configuración de Recordatorios de Dosis": "⏰ Dose Reminder Settings",
  "Recibe notificaciones del sistema Android en tu teléfono para no olvidar tu inyección programada.": "Get Android system notifications on your phone so you never miss your scheduled injection.",
  "Medicamento / Péptido": "Medication / Peptide",
  "Hora del Aviso": "Alert Time",
  "Hora del Recordatorio": "Reminder Time",
  "Hora de la inyección semanal": "Weekly injection time",
  "Día de Administración": "Administration Day",
  "⚡ Probar Notificación": "⚡ Test Notification",
  "Próxima Fecha Programada": "Next Scheduled Date",
  "Recordatorio de próxima dosis": "Next dose reminder",
  "Recordatorios de Inyección": "Injection Reminders",
  "Opcional — te avisaremos el día y hora indicados": "Optional — we will notify you on the indicated day and time",
  "Poner en el Despertador / Reloj del teléfono": "Set in the phone's Clock / Alarm",
  "MisPep programará automáticamente una alarma a la hora que configures": "MisPep will automatically schedule an alarm at the time you set",
  "⚙️ Modificar Persistencia / Batería": "⚙️ Change Persistence / Battery",
  "Registro completo de medicamentos y suplementos con dosis y pauta. Consúltalo en cualquier momento o muéstraselo al médico.": "Full record of medications and supplements with dose and schedule. Check it anytime or show it to your doctor.",
  "¿No está en la lista? Añádelo a mano": "Not in the list? Add it manually",
  "Si rellenas este campo, se usará este nombre y se ignorará la selección del grupo.": "If you fill this field, this name will be used and the group selection will be ignored.",
  "📋 Copiar para el médico": "📋 Copy for the doctor",
  "＋ Añadir Fármaco": "＋ Add Drug",
  "＋ Añadir medicamento personalizado": "＋ Add custom medication",
  "Multivitamínico": "Multivitamin",
  "📝 Mañanas": "📝 Mornings",
  "📝 50000 UI mañanas": "📝 50000 IU mornings",
  "Medicación Hipertensión": "Hypertension Medication",
  "Indica los medicamentos antihipertensivos, la dosis en mg y la hora habitual de la toma. Aparecerán por defecto los de la toma previa.": "Enter antihypertensive medications, dose in mg and usual intake time. The previous dose's entries appear by default.",
  "SELECCIONA UN COLOR CLÍNICO": "SELECT A CLINICAL COLOR",
  "Toca «Cambiar el color» para cambiar el color de un medicamento. Desactiva uno para ocultarlo del panel de recordatorios; tu historial se conserva.": "Tap “Change color” to change a medication's color. Turn one off to hide it from the reminders panel; your history is kept.",
  "✓ Añadir dosis": "✓ Add dose",
  "Nombre del Péptido": "Peptide Name",
  "Fecha de Reconstitución": "Reconstitution Date",
  "Ubicación": "Location",
  "24 días abierto": "24 days open",
  "Reconstituido:  con  BAC": "Reconstituted: with BAC",
  "Subcutánea ": "Subcutaneous ",
  "Selecciona un compuesto para cargar sus viales habituales y pauta de titulación con el agua BAC y extracción U-100.": "Select a compound to load its usual vials and titration schedule with BAC water and U-100 draw.",
  "CJC-1295 (sin DAC)": "CJC-1295 (no DAC)",
  "CJC-1295 con DAC": "CJC-1295 with DAC",
  "CJC-1295 (sin DAC / Mod-GRF 1-29)": "CJC-1295 (no DAC / Mod-GRF 1-29)",
  "GHK-Cu (Péptido de Cobre)": "GHK-Cu (Copper Peptide)",
  "MOTS-c (Péptido Mitocondrial)": "MOTS-c (Mitochondrial Peptide)",
  "Glutatión (GSH)": "Glutathione (GSH)",
  "NAD+ (Nicotinamida Adenina Dinucleótido)": "NAD+ (Nicotinamide Adenine Dinucleotide)",
  "Semax (Heptapéptido ACTH 4-10)": "Semax (ACTH 4-10 Heptapeptide)",
  "Selank (Tuftsina sintética)": "Selank (Synthetic Tuftsin)",
  "DSIP (Péptido inductor del sueño delta)": "DSIP (Delta sleep-inducing peptide)",
  "Panel Integral 16 Biomarcadores (Metabolismo, Hígado, Riñón, Hormonas)": "Comprehensive Panel, 16 Biomarkers (Metabolism, Liver, Kidney, Hormones)",
  "Panel Longevidad y Reparación Celular": "Longevity & Cellular Repair Panel",
  "✓ Dentro del rango óptimo": "✓ Within optimal range",
  "4. ALT / GPT (Hígado)": "4. ALT / GPT (Liver)",
  "5. AST / GOT (Hígado)": "5. AST / GOT (Liver)",
  "7. Creatinina Sérica (Riñón)": "7. Serum Creatinine (Kidney)",
  "9. Triglicéridos": "9. Triglycerides",
  "12. Colesterol LDL (Aterogénico)": "12. LDL Cholesterol (Atherogenic)",
  "14. TSH (Función Tiroidea)": "14. TSH (Thyroid Function)",
  "15. PCR Ultrasensible (Inflamación)": "15. High-sensitivity CRP (Inflammation)",
  "16. Presión Arterial Sistólica": "16. Systolic Blood Pressure",
  "No hay analíticas guardadas.": "No lab tests saved.",
  "Pauta FDA Zepbound: escalada de 2.5 a 15 mg semanal, 4 semanas por escalón.": "FDA Zepbound schedule: escalation from 2.5 to 15 mg weekly, 4 weeks per step.",
  "💡 Pulsa en cualquier casilla de la tabla para cargar automáticamente la dilución en la .": "💡 Tap any cell in the table to automatically load the dilution into the .",
  "💡 Las unidades se recalculan solas al cambiar la dosis, los mg del vial o el agua BAC para mantener siempre la dosis pedida.": "💡 Units recalculate automatically when you change the dose, vial mg or BAC water so the requested dose is always kept.",
  "Seleccionar Péptido": "Select Peptide",
  "En la pantalla de ajustes de Android, selecciona  o permite que MisPep ignore la optimización de ahorro de batería.": "On the Android settings screen, select or allow MisPep to ignore battery-saving optimization.",
  "Para que la notificación suene a la hora elegida con total fiabilidad si el teléfono lleva horas con la pantalla apagada o en reposo profundo (Doze mode),  para que el sistema operativo no la suspenda ni cierre sus alarmas.": "So the notification rings reliably at the chosen time even if the phone has had the screen off for hours or is in deep sleep (Doze mode), so the operating system does not suspend it or cancel its alarms.",
  "Herramienta para investigación y educación. Verifique siempre los cálculos antes de cualquier aplicación.": "Research and education tool. Always verify calculations before any application.",
  "Última copia de cambios: 08/10/26, 19:01 · Última semanal: 02/10/26, 20:00": "Last change backup: 08/10/26, 19:01 · Last weekly: 02/10/26, 20:00",
  "⏰ el día que corresponda tu próxima inyección de péptidos para recordártelo puntualmente.": "⏰ on the day of your next peptide injection to remind you on time.",
  "🛡️ \n          Se guardan solas en  (not erased upon uninstall):\n          •  en rotación () — oldest is rewritten\n          •  () — renewed every 7 days": "🛡️ \n          They are saved automatically in  (not erased upon uninstall):\n          •  in rotation () — oldest is rewritten\n          •  () — renewed every 7 days",
  "Marca si decidiste no administrar esta dosis. No descuenta viales, no altera la curva PK y se registra por separado de una dosis olvidada.": "Check if you decided not to take this dose. It does not discount vials, does not alter the PK curve and is logged separately from a missed dose.",
  "Pentapéptido selectivo del receptor de ghrelina (GHS-R1a, secuencia Aib-His-D-2-Nal-D-Phe-Lys): estimula la liberación pulsátil de GH sin elevar ACTH, cortisol, prolactina ni apetito, a diferencia de los secretagogos clásicos (Raun, 1998). De unión limpia, es el GHRP de referencia para combinar con CJC-1295 sin DAC.": "Selective ghrelin receptor (GHS-R1a) pentapeptide (sequence Aib-His-D-2-Nal-D-Phe-Lys): stimulates pulsatile GH release without raising ACTH, cortisol, prolactin or appetite, unlike classic secretagogues (Raun, 1998). With clean binding, it is the reference GHRP to combine with CJC-1295 no DAC.",
  "Análogo de GHRH de 30 aminoácidos con el complejo de afinidad por fármacos (DAC): un enlazador lo ancla a la albúmina de la sangre y mantiene GH e IGF-1 elevados de forma continua durante días, frente a los minutos del péptido natural (Jetté, 2005). Es la versión de acción prolongada de la familia.": "30-amino-acid GHRH analogue with the drug affinity complex (DAC): a linker anchors it to blood albumin and keeps GH and IGF-1 continuously elevated for days, versus minutes for the natural peptide (Jetté, 2005). It is the long-acting version of the family.",
  "Derivado metilado del GHRP-6 y secretagogo de GH más potente de la familia: además del receptor de ghrelina se une a CD36 en el tejido cardíaco y vascular, motivo de su literatura de cardioprotección directa independiente de GH (Mao, 2014). También llamada examorelina.": "Methylated GHRP-6 derivative and the family's most potent GH secretagogue: besides the ghrelin receptor it binds CD36 in cardiac and vascular tissue, hence its literature on direct GH-independent cardioprotection (Mao, 2014). Also called examorelin.",
  "Análogo de IGF-1 de 83 aminoácidos con extensión N-terminal de 13 residuos y sustitución Arg3 que lo hacen resistente a las proteínas de unión: más señalización PI3K/Akt por cada molécula libre (Tomas, 1992). Hipertrofia e hiperplasia muscular y recuperación; riesgo real de hipoglucemia: tener carbohidratos a mano.": "83-amino-acid IGF-1 analogue with a 13-residue N-terminal extension and Arg3 substitution that make it resistant to binding proteins: more PI3K/Akt signalling per free molecule (Tomas, 1992). Muscle hypertrophy and hyperplasia plus recovery; real risk of hypoglycaemia: keep carbohydrates at hand.",
  "Inhibidor de NNMT de molécula pequeña (NO es un péptido): metilquinolinio que atraviesa las membranas para bloquear la nicotinamida N-metiltransferasa, alterando el manejo de nicotinamida y donantes de metilo (Neelakantan, 2018). Pérdida de grasa, sensibilidad a la insulina y preservación de masa magra, solo preclínico. Vía oral: 25 mg/día de inicio hasta 50-75 mg/día; referencia inyectable 150-500 mcg/día s.c.": "Small-molecule NNMT inhibitor (NOT a peptide): a methylquinolinium that crosses membranes to block nicotinamide N-methyltransferase, altering nicotinamide handling and methyl donors (Neelakantan, 2018). Fat loss, insulin sensitivity and lean mass preservation, preclinical only. Oral route: 25 mg/day starting, up to 50-75 mg/day; injectable reference 150-500 mcg/day SubQ.",
  "Acilhidrazona de molécula pequeña (NO es un péptido) que activa los tres receptores ERR (alfa, beta y gamma): desencadena la señal génica del ejercicio aeróbico, biogénesis mitocondrial y oxidación de grasas. En ratones sedentarios aumentó ~70% el tiempo de carrera (Billon, 2023). Sin datos en humanos: inicio 5 mg/día s.c. o 25 mg oral, ciclos de 4-8 semanas.": "Small-molecule acylhydrazone (NOT a peptide) that activates all three ERR receptors (alpha, beta and gamma): triggers the gene signature of aerobic exercise, mitochondrial biogenesis and fat oxidation. In sedentary mice it increased running time by ~70% (Billon, 2023). No human data: start 5 mg/day SubQ or 25 mg oral, 4-8 week cycles.",
  "Inicio 5 mg/día s.c. (rango de referencia 2-5 mg/día) o 25 mg/día oral; ciclos cortos de 4-8 sem. Referencia preclínica en roedores: 25-50 mg/kg/día.": "Start 5 mg/day SubQ (reference range 2-5 mg/day) or 25 mg/day oral; short 4-8 week cycles. Preclinical rodent reference: 25-50 mg/kg/day.",
  "ORAL 25 mg/día 1-2 sem → 50-75 mg/día. Ciclo 8-12 sem + 4 de descanso.": "ORAL 25 mg/day for 1-2 wks → 50-75 mg/day. Cycle 8-12 wks + 4 off.",
  "20 mcg/día 2-3 días → 40-80 mcg/día s.c. o IM post-entreno (máx. 100 mcg/día). Ciclo 10 días on / 4 sem off.": "20 mcg/day for 2-3 days → 40-80 mcg/day SubQ or IM post-workout (max 100 mcg/day). Cycle 10 days on / 4 wks off.",
  "Decapéptido YNWNSFGLRF, la pieza activa de 10 aminoácidos de la kisspeptina (gen KISS1): actúa sobre el receptor GPR54/KISS1R y enciende las neuronas GnRH, situándose como el interruptor maestro río arriba del eje reproductivo HPG (Dhillo, 2005).": "Decapeptide YNWNSFGLRF, the 10-amino-acid active piece of kisspeptin (KISS1 gene): acts on the GPR54/KISS1R receptor and switches on GnRH neurons, making it the master switch upstream of the HPG reproductive axis (Dhillo, 2005).",
  "Nonapéptido de nueve residuos cerrado en anillo por un puente disulfuro: la primera hormona polipeptídica secuenciada y sintetizada, trabajo que valió el Nobel de Química de 1955 a du Vigneaud. Se estudia por su receptor OXTR, acoplado a proteínas G, en neurociencia social, apego y modulación del dolor (Gimpl y Fahrenholz, 2001).": "Nine-residue nonapeptide ring-closed by a disulfide bridge: the first polypeptide hormone sequenced and synthesised, work that earned du Vigneaud the 1955 Nobel Prize in Chemistry. Studied via its G protein-coupled OXTR receptor in social neuroscience, bonding and pain modulation (Gimpl and Fahrenholz, 2001).",
  "⚠️ Contraindications: Cáncer activo (cautela con antecedente oncológico); embarazo/lactancia; menores/placas de crecimiento abiertas; hipersensibilidad; diabetes mal controlada; apnea del sueño grave no tratada.": "⚠️ Contraindications: Active cancer (caution with oncological history); pregnancy/breastfeeding; minors/open growth plates; hypersensitivity; poorly controlled diabetes; untreated severe sleep apnoea.",
  "⚠️ Contraindications: Cáncer activo o historial oncológico reciente (menos de 5 años); retinopatía diabética proliferativa; acromegalia; embarazo/lactancia; menores de 18 años; insuficiencia hepática o renal grave; diabetes inestable (hipoglucemia).": "⚠️ Contraindications: Active cancer or recent oncological history (under 5 years); proliferative diabetic retinopathy; acromegaly; pregnancy/breastfeeding; under 18; severe hepatic or renal impairment; unstable diabetes (hypoglycaemia).",
  "⚠️ Contraindications: Cáncer activo o sospechado (tumores sensibles a GH/IGF-1); hipersensibilidad; embarazo/lactancia; diabetes o intolerancia a la glucosa; acromegalia/exceso de GH; niños con placas de crecimiento abiertas.": "⚠️ Contraindications: Active or suspected cancer (GH/IGF-1-sensitive tumours); hypersensitivity; pregnancy/breastfeeding; diabetes or glucose intolerance; acromegaly/GH excess; children with open growth plates.",
  "⚠️ Contraindications: Cáncer activo/antecedentes; embarazo/lactancia; diabetes no controlada; hipersensibilidad a péptidos; túnel carpiano (precaución).": "⚠️ Contraindications: Active cancer/history; pregnancy/breastfeeding; uncontrolled diabetes; peptide hypersensitivity; carpal tunnel (caution).",
  "⚠️ Contraindications: Embarazo/lactancia; IMAO (contraindicado); ISRS u otros serotoninérgicos (precaución); dieta rica en tiramina; hipertensión o hipotensión; enfermedades crónicas; sin ensayos en humanos.": "⚠️ Contraindications: Pregnancy/breastfeeding; MAOIs (contraindicated); SSRIs or other serotonergic drugs (caution); tyramine-rich diet; hypertension or hypotension; chronic disease; no human trials.",
  "⚠️ Contraindications: Hipersensibilidad; embarazo/lactancia (salvo fertilidad supervisada); cánceres hormonodependientes (mama, próstata, endometrio); niños/prepuberales; tratamiento con análogos GnRH o anticonceptivos hormonales.": "⚠️ Contraindications: Hypersensitivity; pregnancy/breastfeeding (except supervised fertility); hormone-dependent cancers (breast, prostate, endometrium); children/prepubertal; treatment with GnRH analogues or hormonal contraceptives.",
  "⚠️ Contraindications: Sin datos de seguridad humana (RUO, solo investigación). Evitar en embarazo/lactancia, insuficiencia hepática o renal, cardiopatía, cáncer activo y menores de 18 años.": "⚠️ Contraindications: No human safety data (RUO, research only). Avoid in pregnancy/breastfeeding, hepatic or renal impairment, heart disease, active cancer and under 18.",
  "⚠️ Contraindications: Sufrimiento fetal/desproporción cefalopélvica; ≥2 cesáreas previas; placenta previa; presentación anómala; prolapso de cordón; hipertonía uterina; hipersensibilidad.": "⚠️ Contraindications: Fetal distress/cephalopelvic disproportion; ≥2 previous caesareans; placenta praevia; abnormal presentation; cord prolapse; uterine hypertonus; hypersensitivity.",
  "Can I shake the vial to dissolve it faster?": "Can I shake the vial to dissolve it faster?"
};


  // === Traducción de fragmentos dinámicos (textos montados por JS con números/fechas) ===
  var FRAG_WORD_RE = [
    [/\bDiferencia vs peso anterior:\b/gi, "Difference vs previous weight:"],
    [/\bDiferencia vs peso anterior\b/gi, "Difference vs previous weight"],
    [/\bDetalle y Amplitud de Peso\b/gi, "Weight Detail & Amplitude"],
    [/\bDetalle y Amplitud de Presión\b/gi, "Blood Pressure Detail & Amplitude"],
    [/\bDetalle y Amplitud de Presión Arterial\b/gi, "Blood Pressure Detail & Amplitude"],
    [/\bDetalle y Amplitud\b/gi, "Detail & Amplitude"],
    [/\bEvolución y Variación de Peso\b/gi, "Weight Evolution & Variation"],
    [/\bEvolución y Variación\b/gi, "Evolution & Variation"],
    [/\bSincronizar datos de Health Connect\b/gi, "Sync Health Connect data"],
    [/\bImportar datos de Health Connect\b/gi, "Import Health Connect data"],
    [/\bConectar con Health Connect\b/gi, "Connect with Health Connect"],
    [/\bSin pesajes ni mediciones de tensión nuevas\b/gi, "No new weight or blood pressure logs"],
    [/\bSin mediciones de tensión nuevas\b/gi, "No new blood pressure readings"],
    [/\bSin pesajes nuevos\b/gi, "No new weight logs"],
    [/\bmedias en 15 min calculadas\b/gi, "15-min averages calculated"],
    [/\bmedias en 15 min\b/gi, "15-min averages"],
    [/\b● Peso \(kg\)\b/gi, "● Weight (lb)"],
    [/\bPeso \(kg\)\b/gi, "Weight (lb)"],
    [/\b● Peso\b/gi, "● Weight"],
    [/\bDetalle de cada pesaje \(±4 registros\)\b/gi, "Details of each weigh-in (±4 records)"],
    [/\bEvolución y Amplitud de Peso\b/gi, "Weight Evolution & Amplitude"],
    [/\bEvolución y Amplitud de Rango\b/gi, "Range Evolution & Amplitude"],
    [/\bPrimer pesaje registrado\b/gi, "First recorded weigh-in"],
    [/\bpesaje\(s\) antes\b/gi, "weigh-in(s) before"],
    [/\bpesaje\(s\) después\b/gi, "weigh-in(s) after"],
    [/\bpesaje anterior\b/gi, "previous weigh-in"],
    [/\bpesajes\b/gi, "weigh-ins"],
    [/\bpesaje\b/gi, "weigh-in"],
    [/\bAmplitud del rango diario\b/gi, "Daily range amplitude"],
    [/\bAmplitud:\b/gi, "Amplitude:"],
    [/\bAmplitud\b/gi, "Amplitude"],
    [/\bRango Sistólica\b/gi, "Systolic Range"],
    [/\bRango Diastólica\b/gi, "Diastolic Range"],
    [/\bSistólica\b/gi, "Systolic"],
    [/\bDiastólica\b/gi, "Diastolic"],
    [/\bvida media\b/gi, "half-life"],
    [/\bsemivida\b/gi, "half-life"],
    [/\bdías\b/g, "days"], [/\bDías\b/g, "Days"],
    [/\bdía\b/g, "day"], [/\bDía\b/g, "Day"],
    [/\bdosis\b/g, "doses"], [/\bDosis\b/g, "Doses"],
    [/\bsemanas\b/g, "weeks"], [/\bSemanas\b/g, "Weeks"],
    [/\bsem\b/g, "wks"],
    [/\bmeses\b/g, "months"], [/\bmes\b/g, "mo"],
    [/\bmarcas\b/g, "marks"], [/\bMarcas\b/g, "Marks"],
    [/\bunidades\b/g, "units"], [/\bUnidades\b/g, "Units"],
    [/\bhoras\b/g, "hours"], [/\bminutos\b/g, "minutes"], [/\bsegundos\b/g, "seconds"],
    [/\babierto\b/g, "open"], [/\babierta\b/g, "open"],
    [/\bGlúteo\b/g, "Glute"], [/\bglúteo\b/g, "glute"],
    [/\bMuslo\b/g, "Thigh"], [/\bmuslo\b/g, "thigh"],
    [/\bizquierd[oa]\b/g, "left"], [/\bderech[oa]\b/g, "right"],
    [/\bsuperior\b/g, "upper"], [/\binferior\b/g, "lower"],
    [/\bHace\b/g, ""], [/\bhace\b/g, ""], [/\bQuedan\b/g, ""], [/\bqueda\b/g, ""],
    [/\baprox\./g, "approx."],
    [/\bPulso\b/g, "Pulse"], [/\bpulso\b/g, "pulse"],
    [/\bppm\b/g, "bpm"],
    [/\bToma habitual\b/g, "Usual time"], [/\btoma habitual\b/g, "usual time"],
    [/\bÚltima\b/g, "Last"], [/\búltima\b/g, "last"], [/\bÚltimo\b/g, "Last"], [/\búltimo\b/g, "last"],
    [/\bPróxima\b/g, "Next"], [/\bpróxima\b/g, "next"],
    [/\bplanificada\b/g, "planned"], [/\bPlanificada\b/g, "Planned"],
    [/\bp[eé]rdida\b/gi, "loss"], [/\bganancia\b/gi, "gain"],
    [/\bpeso\b/g, "weight"], [/\bPeso\b/g, "Weight"],
    [/\bmedia\b/g, "average"], [/\bMedia\b/g, "Average"],
    [/\bnivel\b/g, "level"], [/\bNivel\b/g, "Level"],
    [/\btotal\b/g, "total"], [/\bTotal\b/g, "Total"],
    [/\binyecci[oó]n\b/gi, "injection"], [/\bInyecci[oó]n\b/gi, "Injection"],
    [/\bmedicamento\b/g, "medication"], [/\bMedicamento\b/g, "Medication"],
    [/\bdisponible\b/g, "available"], [/\bDisponible\b/g, "Available"],
    [/\bcaduca\b/g, "expires"], [/\bcaducado\b/g, "expired"],
    [/\bconserva\b/g, "kept"], [/\breserva\b/g, "reserve"],
    [/\bdel peso inicial\b/g, "of starting weight"],
    [/\bdel pico de una sola dosis\b/g, "of single-dose peak"],
    [/\bqueda aprox\.\b/g, "approx. remaining"],
    [/\bQueda aprox\.\b/g, "Approx. remaining"],
    [/\bAcumulado\b/g, "Cumulative"],
    [/\bacumulado\b/g, "cumulative"],
    [/\bdesde tu [uú]ltima dosis\b/g, "since your last dose"],
    [/\bAhora mismo\b/g, "Right now"],
    [/\bMi[eé]rcoles\b/g, "Wednesday"], [/\bLunes\b/g, "Monday"], [/\bMartes\b/g, "Tuesday"],
    [/\bJueves\b/g, "Thursday"], [/\bViernes\b/g, "Friday"], [/\bS[aá]bado\b/g, "Saturday"], [/\bDomingo\b/g, "Sunday"],
    [/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/g, function(m) {
      return {enero:"January",febrero:"February",marzo:"March",abril:"April",mayo:"May",junio:"June",julio:"July",agosto:"August",septiembre:"September",octubre:"October",noviembre:"November",diciembre:"December"}[m.toLowerCase()] || m;
    }],
    [/\bÚltima copia de cambios\b/g, "Last change backup"],
    [/\bÚltima semanal\b/g, "Last weekly"],
    [/\bSe guardan solas en\b/g, "They are saved automatically in"],
    [/\bno se borran al desinstalar\b/g, "not erased upon uninstall"],
    [/\ben rotaci[oó]n\b/g, "in rotation"],
    [/\bse reescribe la m[aá]s antigua\b/g, "oldest is rewritten"],
    [/\bsolo se renueva cada 7 d[ií]as\b/g, "renewed every 7 days"],
    [/\ben curso\b/g, "ongoing"],
    [/\bSemivida corta\b/g, "short half-life"],
    [/\bSemivida\b/g, "Half-life"],
    [/\b[uú]ltima toma\b/g, "last dose"], [/\bÚltima toma\b/g, "Last dose"],
    [/\bTotal BAC Water in Vial\b/g, "Total BAC Water in Vial"],
    // ===== plantillas dinamicas (texto interpolado por JS) =====
    [/([+\-]?\d+(?:[.,]\d+)?)\s*%\s*del peso inicial/g, "$1% of starting weight"],
    [/(\d+(?:[.,]\d+)?)\s*%\s*del pico de una sola dosis/g, "$1% of single-dose peak"],
    [/(\d+)\s*d desde tu \u00faltima dosis/g, "$1 d since your last dose"],
    [/(\d+)\s*dosis en total\)\.\s*Se agotar\u00e1 el/g, "$1 doses in total). It will run out on"],
    [/Tu reserva durar\u00e1/g, "Your supply will last"],
    [/de agua BAC al vial de ([\d.,]+) mg\. As\u00ed, cada/g, "of BAC water to the $1 mg vial. That way, each"],
    [/equivaldr\u00e1n exactamente a tu dosis de/g, "will equal exactly your dose of"],
    [/de jeringa U-100 \(([^)]+)\) para/g, "of U-100 syringe ($1) for"],
    [/Con (\d+) pulverizaci\u00f3n\(es\) recibes/g, "With $1 spray(s) you receive"],
    [/\(aprox\. ([\d.,]+) en cada fosa nasal\)/g, "(approx. $1 in each nostril)"],
    [/horas con la pantalla apagada o en reposo profundo \(Doze mode\)/g, "hours with the screen off or in deep sleep (Doze mode)"],
    [/(\d+)\s*tomas\):/g, "$1 readings):"],
    [/Objetivo \((\d+)\s*kg\)/g, "Goal ($1 kg)"],
    [/^Objetivo$/g, "Goal"],
    [/Semana (\d+)/g, "Week $1"],
    [/\u00daltima copia de cambios:/g, "Last change backup:"],
    [/\u00daltima semanal:/g, "Last weekly backup:"],
    [/\u00daltima medida:/g, "Last reading:"],
    [/\u00daltima toma/g, "Last dose"],
    [/Pulso:\s*/g, "Pulse: "],
    [/\b1 a 2 veces por semana \(SubQ\)/g, "1 to 2 times per week (SubQ)"],
    [/A demanda o diario \(Intranasal o SubQ\)/g, "As needed or daily (Intranasal or SubQ)"],
    [/5 minutos \(efectos centrales prolongados\)/g, "5 minutes (prolonged central effects)"],
    [/veces por semana:/gi, "times per week:"],
    [/Rango diario \((\d+) tomas\):/g, "Daily range ($1 readings):"],
    [/Extraer en la Jeringa/g, "Draw into Syringe"],
    [/Jeringa U-100 \(100u \/ mL\)/g, "U-100 Syringe (100u / mL)"],
    [/Jeringa U-40 \(40u \/ mL\)/g, "U-40 Syringe (40u / mL)"],
    [/Editar horario/g, "Edit schedule"],
    [/Guardar Horario/g, "Save Schedule"],
    [/\u2699\ufe0f Altura y Meta/g, "\u2699\ufe0f Height & Goal"],
    [/Guardar Registro/g, "Save Record"],
    [/Unidad de fuerza activa/g, "Active strength unit"],
    [/Vial actual \(mg\)/g, "Current vial (mg)"],
    [/Nueva Lectura/g, "New Reading"],
    [/Fecha y Hora/g, "Date & Time"],
    [/Cerrar/g, "Close"],
    [/Pulsa en cualquier casilla de la tabla para cargar autom\u00e1ticamente la diluci\u00f3n en la/g, "Tap any cell in the table to load the dilution automatically in the"],
    [/Endotoxinas:/g, "Endotoxins:"],
    [/optimizaci\u00f3n de ahorro de bater\u00eda/g, "battery optimization"],
    [/el d\u00eda que corresponda tu pr\u00f3xima inyecci\u00f3n/g, "on the day of your next injection"],
    [/inyecci\u00f3n de p\u00e9ptidos para record\u00e1rtelo puntualmente/g, "peptide injection to remind you on time"],
    [/para que el sistema operativo no la suspenda ni cierre sus alarmas/g, "so the operating system does not suspend it or dismiss its alarms"],
    // ===== palabras y frases cortas =====
    [/\bACTIVO\b/g, "ACTIVE"], [/\bActivo\b/g, "Active"], [/\bactivo\b/g, "active"],
    [/\bBorrar\b/g, "Delete"], [/\bborrar\b/g, "delete"], [/\bGuardar\b/g, "Save"], [/\bguardar\b/g, "save"],
    [/\bNueva\b/g, "New"], [/\bNuevo\b/g, "New"], [/\bAltura\b/g, "Height"], [/\baltura\b/g, "height"],
    [/\bMeta\b/g, "Goal"], [/\bHorario\b/g, "Schedule"], [/\bRegistro\b/g, "Record"], [/\bLectura\b/g, "Reading"],
    [/\bJeringa\b/g, "Syringe"], [/\bjeringa\b/g, "syringe"], [/\bEndotoxinas\b/g, "Endotoxins"],
    [/\bMasa Total\b/g, "Total Mass"], [/\bMasa\b/g, "Mass"], [/\bAgua\b/g, "Water"], [/\bagua\b/g, "water"],
    [/\bDiario\b/g, "Daily"], [/\bdiario\b/g, "daily"], [/\bSemanal\b/g, "Weekly"], [/\bsemanal\b/g, "weekly"],
    [/\bSemanas\b/g, "Weeks"], [/\bsemanas\b/g, "weeks"], [/\bSemana\b/g, "Week"], [/\bsemana\b/g, "week"],
    [/\bDosis\b/g, "Dose"], [/\bdosis\b/g, "doses"], [/\bPeso\b/g, "Weight"], [/\bpeso\b/g, "weight"],
    [/\bMedida\b/g, "Reading"], [/\bmedida\b/g, "reading"], [/\bToma\b/g, "Dose"], [/\btoma\b/g, "dose"],
    [/\bReserva\b/g, "Supply"], [/\breserva\b/g, "supply"], [/\bvida media\b/g, "half-life"],
    [/\bVida media\b/g, "Half-life"], [/\bSemivida\b/g, "Half-life"], [/\bhoras\b/g, "hours"],
    [/\bminutos\b/g, "minutes"], [/\bd\u00edas\b/g, "days"], [/\bd\u00eda\b/g, "day"], [/\bunidades\b/g, "units"],
    [/\bmarcas\b/g, "marks"], [/\bCambios\b/g, "Changes"], [/\bcambios\b/g, "changes"], [/\bNivel\b/g, "Level"],
    [/\bnivel\b/g, "level"], [/\bMedicamento\b/g, "Medication"], [/\bmedicamento\b/g, "medication"],
    [/Solo si es necesario \(a demanda\)/g, "Only if needed (as needed)"],
    [/^Para que la notificaci\u00f3n suene a la hora elegida con total fiabilidad si el tel\u00e9fono lleva/g, "So the notification reliably rings at the chosen time even if the phone has been idle for"],
    [/, para que el sistema operativo no la suspenda ni cierre sus alarmas\./g, " \u2014 so the operating system does not suspend it or dismiss its alarms."],
    [/\bA\u00f1ade\b/g, "Add"], [/\ba\u00f1ade\b/g, "add"], [/\bA\u00f1adir\b/g, "Add"], [/\ba\u00f1adir\b/g, "add"],
    [/\bDespu\u00e9s\b/g, "After"], [/\bdespu\u00e9s\b/g, "after"], [/\bAntes\b/g, "Before"], [/\bantes\b/g, "before"],
    [/Inyecciones totales/g, "Total injections"],
    [/Exportar Copia Completa \(JSON\)/g, "Export Full Backup (JSON)"],
    [/Exportar Historial \(CSV\)/g, "Export History (CSV)"],
    [/Exportar informe de salud/g, "Export health report"],
    [/Por Marca \(Tick\)/g, "Per Mark (Tick)"],
    [/Reconstituido:/g, "Reconstituted:"],
    [/\u2605 Punto recomendado resaltado en esmeralda/g, "\u2605 Recommended point highlighted in emerald"],
    [/En la pantalla de ajustes de Android, selecciona/g, "On the Android settings screen, select"],
    [/Toca el cuerpo para elegir una zona/g, "Tap the body to choose a site"],
    [/Marca si sigues tu horario/g, "Check if you follow your schedule"],
    [/Cambiar el color/g, "Change color"],
    [/como lo tomas/g, "how you take it"],
    [/\u2014 Selecciona un grupo \u2014/g, "\u2014 Select a group \u2014"],
    [/para administrar/g, "to administer"],
    [/\bInyecciones\b/g, "Injections"], [/\binyecciones\b/g, "injections"],
    [/\bMedidas\b/g, "Measurements"], [/\bmedidas\b/g, "measurements"],
    [/\bCalculadora\b/g, "Calculator"], [/\bcalculadora\b/g, "calculator"],
    [/\bCompartir\b/g, "Share"], [/\bcompartir\b/g, "share"],
    [/\bviales\b/g, "vials"], [/\bViales\b/g, "Vials"],
    [/\bExportar\b/g, "Export"], [/\bexportar\b/g, "export"],
    [/\bSelecciona\b/g, "Select"], [/\bselecciona\b/g, "select"],
    [/\bCambiar\b/g, "Change"], [/\bcambiar\b/g, "change"],
    [/\bElegir\b/g, "Choose"], [/\belegir\b/g, "choose"],
    [/\bToca\b/g, "Tap"], [/\btoca\b/g, "tap"],
    [/\bOtro\b/g, "Other"], [/\botro\b/g, "other"], [/\bOtra\b/g, "Other"], [/\botra\b/g, "other"],
    [/Misma pauta/g, "Same schedule"],
    [/sobre\(s\)/g, "sachet(s)"],
    [/\u26a0\ufe0f IMPORTANTE PARA ANDROID:/g, "\u26a0\ufe0f IMPORTANT FOR ANDROID:"],
    [/\bFecha\b/g, "Date"], [/\bfecha\b/g, "date"],
    [/Restaurar Copia de Seguridad \(JSON\)/g, "Restore Backup (JSON)"],
    [/Restaurar copia de seguridad/gi, "Restore backup"],
    [/Persistencia y Avisos \(9:00 AM\)/g, "Persistence & Alerts (9:00 AM)"],
    [/Persistencia y Avisos/gi, "Persistence & Alerts"],
    [/Quiero ayudar al programador/g, "Support the Developer"],
    [/Sin registros de presión arterial/g, "No blood pressure records"],
    [/Sin registros para mostrar medicación/g, "No records to show medication"],
    [/Configura altura y peso/g, "Set up height & weight"],
    [/Sin datos/g, "No data"],
    [/Abrir cartera/g, "Open wallet"],
  ];
  var FRAG_MONTHS = { ene:"Jan", feb:"Feb", mar:"Mar", abr:"Apr", may:"May", jun:"Jun",
                      jul:"Jul", ago:"Aug", sept:"Sep", sep:"Sep", oct:"Oct", nov:"Nov", dic:"Dec" };
  // Frases largas primero: evita que una palabra suelta rompa una plantilla
  FRAG_WORD_RE.sort(function(a, b) { return String(b[0]).length - String(a[0]).length; });
  var FRAG_ES_SIGNAL = /[áéíóúñÁÉÍÓÚÑ¿¡]|\b(dosis|d[ií]as|unidades|marcas|semanas|meses|semivida|vida media|pulso|planificada|inyecci[oó]n|habitual|pesaje|tensi[oó]n|[aá]nimo|medicamento|p[eé]rdida)\b/i;

  function translateFragment(txt) {
    var out = txt;
    if (/[áéíóúñÁÉÍÓÚÑ¿¡]|\b(ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)\b/.test(out)) {
      out = out.replace(/\b(ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)\b/g, function(m) {
        return FRAG_MONTHS[m.toLowerCase()] || m;
      });
    }
    for (var i = 0; i < FRAG_WORD_RE.length; i++) out = out.replace(FRAG_WORD_RE[i][0], FRAG_WORD_RE[i][1]);
    out = out.replace(/\s{2,}/g, ' ').trim();
    return (out === txt) ? null : out;
  }

  // Caché de textos originales (en español) para poder restaurarlos
  var _origText = new WeakMap();
  var _origAttr = new WeakMap();

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };
  var NURX = /^[0-9.,\s:;\/\-\+%\(\)°×·]+$/;

  function isTranslatableText(txt) {
    if (!txt) return false;
    if (txt.length < 2) return false;
    if (NURX.test(txt)) return false;
    return true;
  }

  function translateDom(root) {
    if (!root) root = document.body;
    if (!root) return 0;
    var isEn = (currentLang === 'en');
    var count = 0;

    // 1. Nodos de texto
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      var parent = node.parentElement;
      if (!parent) continue;
      if (SKIP_TAGS[parent.tagName]) continue;
      if (parent.closest && parent.closest('[data-i18n-skip]')) continue;

      var raw = node.textContent;
      var trimmed = raw.trim();
      if (!trimmed) continue;

      if (isEn) {
        if (!_origText.has(node)) {
          if (!isTranslatableText(trimmed)) continue;
          var tr = DICT_ES_EN[trimmed];
          if (tr === undefined) tr = translateFragment(trimmed);
          if (tr === undefined || tr === null) continue;
          _origText.set(node, raw);
          node.textContent = raw.replace(trimmed, tr);
          count++;
        }
      } else {
        if (_origText.has(node)) {
          node.textContent = _origText.get(node);
          _origText.delete(node);
          count++;
        }
      }
    }

    // 2. Atributos (placeholder, title, aria-label)
    var attrEls = root.querySelectorAll ? root.querySelectorAll('[placeholder],[title],[aria-label]') : [];
    for (var i = 0; i < attrEls.length; i++) {
      var el = attrEls[i];
      var orig = _origAttr.get(el);
      if (isEn) {
        if (!orig) { orig = {}; _origAttr.set(el, orig); }
        ['placeholder', 'title', 'aria-label'].forEach(function(attr) {
          var v = el.getAttribute(attr);
          if (!v) return;
          var tv = v.trim();
          if (!isTranslatableText(tv)) return;
          if (orig[attr] === undefined) {
            var tr2 = DICT_ES_EN[tv];
            if (tr2 === undefined) return;
            orig[attr] = v;
            el.setAttribute(attr, v.replace(tv, tr2));
            count++;
          }
        });
      } else if (orig) {
        ['placeholder', 'title', 'aria-label'].forEach(function(attr) {
          if (orig[attr] !== undefined) {
            el.setAttribute(attr, orig[attr]);
            delete orig[attr];
            count++;
          }
        });
      }
    }

    return count;
  }

  // Objeto público
  window.MISPEP_I18N = {
    getLang: getLang,
    setLang: setLang,
    toggleLang: toggleLang,
    t: t,
    apply: apply,
    translateDom: translateDom,
    dictEsEn: DICT_ES_EN,
    peptidesEn: peptidesEn,
    categoriesEn: categoriesEn,
    ui: ui,
    translateFragment: translateFragment
  };

  // Envolver switchModule para traducir el contenido dinámico de cada módulo al abrirlo
  var _origSwitchModule = null;
  function hookSwitchModule() {
    if (window.switchModule && window.switchModule !== _origSwitchModule) {
      _origSwitchModule = window.switchModule;
      var prev = window.switchModule;
      window.switchModule = function(id) {
        var r = prev.apply(this, arguments);
        try {
          if (currentLang === 'en') {
            setTimeout(function() {
              var el = document.getElementById('module-' + id);
              if (el) translateDom(el);
            }, 0);
          }
        } catch(e) {}
        return r;
      };
    }
  }


  // Re-traducir textos que JS escribe después del primer pase (valores dinámicos)
  var _moScheduled = false, _moLastRun = 0;
  function scheduleTranslate() {
    if (_moScheduled) return;
    _moScheduled = true;
    var wait = Math.max(120, 400 - (Date.now() - _moLastRun));
    setTimeout(function() {
      _moScheduled = false;
      _moLastRun = Date.now();
      try { if (currentLang === 'en') translateDom(document.body); } catch (e) {}
    }, wait);
  }
  function initObserver() {
    if (!window.MutationObserver || !document.body) return;
    try {
      var mo = new MutationObserver(function(muts) {
        if (currentLang !== 'en') return;
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          var tgt = m.target;
          if (tgt && tgt.nodeType === 1 && tgt.closest && tgt.closest('svg,canvas,.chart,canvas *')) continue;
          if (m.type === 'characterData' || (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length))) {
            scheduleTranslate();
            return;
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) {}
  }

  // Inicializar al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      apply();
      initObserver();
    });
  } else {
    apply();
    initObserver();
  }

})(window);
