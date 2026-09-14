/**
 * AgriVision AI — PlantVillage 38-Class Agronomic Ontology
 * ==========================================================
 * Complete disease database for every class the model can predict.
 * Keyed by the canonical PlantVillage class folder name.
 *
 * `getDiseaseDetails()` performs a tolerant, normalized lookup so it works
 * whether the class id comes from the original PlantVillage naming, the
 * Kaggle "New Plant Diseases Dataset" naming, or the model's class_names.json.
 */

// ---------------------------------------------------------------------------
// Shared prescription blocks (kept DRY; overridden per-disease where needed)
// ---------------------------------------------------------------------------
const RX = {
  fungal: {
    chemicalPrescription: {
      activeIngredients: ['Mancozeb 75% WP', 'Chlorothalonil 75% WP', 'Azoxystrobin 23% SC'],
      tradeNames: ['Dithane M-45', 'Kavach', 'Amistar'],
      dosage: '2.0 – 2.5 g / L water',
      applicationMethod: 'Uniform foliar mist covering upper and lower leaf surfaces.',
      reEntryInterval: '24 hrs',
      preHarvestInterval: '7 days',
      precautions: 'Alternate FRAC groups to prevent resistance. Avoid spraying before rain or high wind.',
    },
    organicPrescription: {
      biocontrol: ['Trichoderma viride @ 5 g/L', 'Bacillus subtilis @ 2 g/L'],
      botanical: 'Cold-pressed Neem seed oil (1500 ppm Azadirachtin) @ 5 ml/L.',
      minerals: 'Copper Hydroxide (OMRI listed) or Potassium Bicarbonate @ 2 g/L.',
    },
    schedule14Day: {
      day1: 'Apply primary protectant fungicide; prune and destroy infected leaves.',
      day3: 'Audit irrigation and canopy moisture; keep lower foliage dry.',
      day7: 'Rotate to a systemic FRAC group or bio-fungicide (Serenade / Trichoderma).',
      day14: 'Foliar scouting audit; resume organic protocol if < 2 lesions per plant.',
    },
    culturalPractices: [
      'Prune and destroy infected leaves and debris.',
      'Improve air circulation; avoid overhead irrigation.',
      'Mulch soil to prevent splash dispersal of spores.',
      'Rotate crops and plant resistant varieties.',
    ],
  },

  oomycete: {
    chemicalPrescription: {
      activeIngredients: ['Metalaxyl 8% + Mancozeb 64% WP', 'Cymoxanil 8% + Mancozeb 64% WP', 'Copper Oxychloride 50% WP'],
      tradeNames: ['Ridomil Gold', 'Curzate', 'Blitox'],
      dosage: '2.5 g / L water',
      applicationMethod: 'Thorough canopy drench, especially leaf undersides.',
      reEntryInterval: '24 hrs',
      preHarvestInterval: '14 days',
      precautions: 'Apply preventively before wet periods; rotate systemic and contact modes of action.',
    },
    organicPrescription: {
      biocontrol: ['Trichoderma harzianum soil drench', 'Pseudomonas fluorescens @ 5 g/L'],
      botanical: 'Neem oil + garlic extract spray.',
      minerals: 'Copper Oxychloride (OMRI) @ 2.5 g/L as a preventive barrier.',
    },
    schedule14Day: {
      day1: 'Apply systemic + contact fungicide immediately; remove cull piles.',
      day3: 'Monitor for water-soaked lesions; keep canopy dry.',
      day7: 'Second preventive spray ahead of expected rain events.',
      day14: 'Destroy any newly blighted plants; rotate chemistry.',
    },
    culturalPractices: [
      'Eliminate cull piles and volunteer plants.',
      'Avoid overhead irrigation and prolonged leaf wetness.',
      'Use certified disease-free seed tubers / transplants.',
      'Apply fungicides preventively before rain.',
    ],
  },

  bacterial: {
    chemicalPrescription: {
      activeIngredients: ['Copper Hydroxide 77% WP', 'Streptomycin + Tetracycline (Streptocycline)', 'Kasugamycin 3% SL'],
      tradeNames: ['Kocide', 'Streptocycline', 'Kasumin'],
      dosage: '2.0 – 3.0 g / L water',
      applicationMethod: 'Fine mist spray at first symptom; repeat every 7–10 days.',
      reEntryInterval: '24 hrs',
      preHarvestInterval: '5 days',
      precautions: 'Copper is phytotoxic in high heat; avoid acidic tank mixes.',
    },
    organicPrescription: {
      biocontrol: ['Bacillus subtilis @ 2 g/L', 'Pseudomonas fluorescens'],
      botanical: 'Neem oil @ 5 ml/L with garlic extract.',
      minerals: 'Copper Hydroxide (OMRI) @ 2 g/L (reduce rate in hot weather).',
    },
    schedule14Day: {
      day1: 'Apply copper-based bactericide; remove infected foliage.',
      day3: 'Avoid overhead irrigation; sanitize tools and hands.',
      day7: 'Follow-up copper/antibiotic spray if weather remains wet.',
      day14: 'Rogue severely infected plants; field audit.',
    },
    culturalPractices: [
      'Use certified disease-free seed and transplants.',
      'Avoid working in wet fields (pathogen spreads by contact).',
      'Rotate away from solanaceous crops for 2–3 years.',
      'Sanitize tools with 70% alcohol or bleach solution.',
    ],
  },

  viral: {
    chemicalPrescription: {
      activeIngredients: ['Imidacloprid 17.8% SL (whitefly vector)', 'Thiamethoxam 25% WG (vector)'],
      tradeNames: ['Confidor', 'Actara'],
      dosage: '0.3 – 0.5 ml / L water',
      applicationMethod: 'Target vectors (whitefly / aphid) on leaf undersides.',
      reEntryInterval: '24 hrs',
      preHarvestInterval: '7 days',
      precautions: 'No direct cure for viruses; vector suppression is the only chemical tool.',
    },
    organicPrescription: {
      biocontrol: ['Neem oil (anti-feedant on vectors)', 'Yellow sticky traps'],
      botanical: 'Neem seed oil @ 5 ml/L to repel whiteflies.',
      minerals: 'Reflective silver mulch to deter insect vectors.',
    },
    schedule14Day: {
      day1: 'Spray vector-control insecticide; rogue infected plants.',
      day3: 'Deploy yellow sticky traps and reflective mulch.',
      day7: 'Repeat vector suppression; remove new symptomatic plants.',
      day14: 'Monitor vector pressure; maintain resistant varieties.',
    },
    culturalPractices: [
      'Control whitefly/aphid vectors with traps and reflective mulch.',
      'Rogue and destroy infected plants immediately.',
      'Plant virus-resistant varieties.',
      'Eliminate weeds that host insect vectors.',
    ],
  },

  pest: {
    chemicalPrescription: {
      activeIngredients: ['Spiromesifen 22.9% SC', 'Abamectin 1.9% EC', 'Wettable Sulphur 80% WP'],
      tradeNames: ['Oberon', 'Vertimec', 'Sulfex'],
      dosage: '0.5 – 1.0 ml / L water',
      applicationMethod: 'Thorough coverage of both leaf surfaces and stems.',
      reEntryInterval: '12 hrs',
      preHarvestInterval: '3 days',
      precautions: 'Rotate acaricide modes of action to slow resistance development.',
    },
    organicPrescription: {
      biocontrol: ['Predatory mites Phytoseiulus persimilis', 'Neoseiulus californicus'],
      botanical: 'Neem oil @ 5 ml/L or insecticidal soap.',
      minerals: 'Wettable Sulphur (OMRI) @ 2 g/L as a mild miticide.',
    },
    schedule14Day: {
      day1: 'Apply acaricide to infested canopy (both leaf surfaces).',
      day3: 'Release predatory mites; raise humidity to suppress mite buildup.',
      day7: 'Follow-up with a different acaricide mode of action.',
      day14: 'Scout for webbing; retreat if mites rebound.',
    },
    culturalPractices: [
      'Spray water jets to physically dislodge mites.',
      'Introduce predatory mites for biological control.',
      'Avoid excessive nitrogen (promotes mite buildup).',
      'Remove and destroy heavily infested leaves.',
    ],
  },

  healthy: {
    chemicalPrescription: {
      activeIngredients: ['None required'],
      tradeNames: [],
      dosage: '—',
      applicationMethod: 'No intervention needed; continue monitoring.',
      reEntryInterval: '—',
      preHarvestInterval: '—',
      precautions: 'Continue routine scouting and balanced nutrition.',
    },
    organicPrescription: {
      biocontrol: ['Preventive Trichoderma soil drench (optional)'],
      botanical: 'None required.',
      minerals: 'Balanced NPK + micronutrient schedule.',
    },
    schedule14Day: {
      day1: 'Continue routine scouting and record-keeping.',
      day3: 'Monitor irrigation and soil moisture.',
      day7: 'Check for early signs of pests or disease.',
      day14: 'Maintain preventive IPM measures in place.',
    },
    culturalPractices: [
      'Continue routine scouting and field records.',
      'Maintain balanced irrigation and fertility.',
      'Keep records for early detection of any change.',
      'Preserve beneficial insects and natural enemies.',
    ],
  },
};

// ---------------------------------------------------------------------------
// The 38-class database
// ---------------------------------------------------------------------------
export const PLANT_DISEASES = {
  // ------------------------------------------------ Apple
  "Apple___Apple_scab": {
    crop: "Apple", disease: "Apple Scab",
    scientificName: "Venturia inaequalis",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Venturiaceae)",
    riskIndex: 62,
    description: "Dark olive-green velvety lesions develop on leaves and fruit, later turning corky and cracked. A primary spring disease of apple orchards.",
    optimalConditions: "Cool wet springs (15–20°C) with prolonged leaf wetness.",
    symptoms: ["Velvety olive-brown spots on leaves", "Corky, cracked lesions on fruit", "Premature leaf drop", "Reduced fruit set and quality"],
    differentials: [{ name: "Apple - Cedar Apple Rust", probability: 0.10 }, { name: "Apple - Black Rot", probability: 0.06 }],
    ...RX.fungal,
  },
  "Apple___Black_rot": {
    crop: "Apple", disease: "Black Rot",
    scientificName: "Botryosphaeria obtusa",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Botryosphaeriaceae)",
    riskIndex: 58,
    description: "Frogeye leaf spots with purple margins and a fruit rot that produces concentric rings and mummified fruit.",
    optimalConditions: "Warm (20–28°C) humid weather; spreads from mummified fruit and cankers.",
    symptoms: ["'Frogeye' leaf spots with purple margins", "Concentric rings on rotting fruit", "Fruit mummification", "Cankers on twigs and limbs"],
    differentials: [{ name: "Apple - Apple Scab", probability: 0.12 }, { name: "Apple - Cedar Apple Rust", probability: 0.05 }],
    ...RX.fungal,
  },
  "Apple___Cedar_apple_rust": {
    crop: "Apple", disease: "Cedar Apple Rust",
    scientificName: "Gymnosporangium juniperi-virginianae",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Basidiomycota (Pucciniaceae)",
    riskIndex: 55,
    description: "Bright yellow-orange rust spots on leaves and fruit; requires a juniper/cedar alternate host to complete its life cycle.",
    optimalConditions: "Cool, wet spring with cedar/juniper alternate hosts nearby.",
    symptoms: ["Bright yellow-orange leaf spots", "Horn-like gelatinous galls on cedar", "Lesions on fruit", "Leaf drop under heavy infection"],
    differentials: [{ name: "Apple - Apple Scab", probability: 0.11 }, { name: "Apple - Black Rot", probability: 0.05 }],
    ...RX.fungal,
  },
  "Apple___healthy": {
    crop: "Apple", disease: "Healthy",
    scientificName: "Malus domestica (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Vigorous, uniformly green foliage with no visible lesions, chlorosis, or pest damage.",
    optimalConditions: "Well-drained soil, balanced fertility, adequate sunlight.",
    symptoms: ["Uniform green leaf color", "No lesions or spots", "Turgid, well-formed leaves", "Normal canopy density"],
    differentials: [],
    ...RX.healthy,
  },

  // ------------------------------------------------ Blueberry
  "Blueberry___healthy": {
    crop: "Blueberry", disease: "Healthy",
    scientificName: "Vaccinium spp. (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Healthy blueberry foliage with normal green color and no disease or pest symptoms.",
    optimalConditions: "Acidic, well-drained soil (pH 4.5–5.5) and full sun.",
    symptoms: ["Uniform green leaves", "No spotting or chlorosis", "Normal shoot growth", "Healthy fruit set"],
    differentials: [],
    ...RX.healthy,
  },

  // ------------------------------------------------ Cherry
  "Cherry_(including_sour)___Powdery_mildew": {
    crop: "Cherry", disease: "Powdery Mildew",
    scientificName: "Podosphaera clandestina",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Erysiphaceae)",
    riskIndex: 48,
    description: "White powdery fungal growth on leaves and shoots that can distort new growth.",
    optimalConditions: "Warm days, cool nights, and moderate humidity with poor air circulation.",
    symptoms: ["White powdery patches on leaves", "Leaf distortion and curling", "Stunted shoots", "Reduced fruit quality"],
    differentials: [{ name: "Cherry - Leaf Spot", probability: 0.09 }, { name: "Cherry - Healthy", probability: 0.06 }],
    ...RX.fungal,
  },
  "Cherry_(including_sour)___healthy": {
    crop: "Cherry", disease: "Healthy",
    scientificName: "Prunus cerasus (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Healthy cherry foliage with normal green color and no lesions or pest damage.",
    optimalConditions: "Well-drained soil, full sun, adequate spacing for airflow.",
    symptoms: ["Uniform green leaves", "No spotting or mildew", "Normal shoot elongation", "Healthy blossom and fruit"],
    differentials: [],
    ...RX.healthy,
  },

  // ------------------------------------------------ Corn (Maize)
  "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
    crop: "Corn (Maize)", disease: "Gray Leaf Spot",
    scientificName: "Cercospora zeae-maydis",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Mycosphaerellaceae)",
    riskIndex: 66,
    description: "Rectangular gray-brown lesions run parallel to leaf veins and coalesce under prolonged humidity, blighting entire leaves.",
    optimalConditions: "Warm (22–30°C), humid conditions with extended leaf wetness.",
    symptoms: ["Rectangular gray lesions parallel to veins", "Necrotic streaks that coalesce", "Premature death of lower leaves", "Reduced grain fill and yield"],
    differentials: [{ name: "Corn - Northern Leaf Blight", probability: 0.15 }, { name: "Corn - Common Rust", probability: 0.08 }],
    ...RX.fungal,
  },
  "Corn_(maize)___Common_rust_": {
    crop: "Corn (Maize)", disease: "Common Rust",
    scientificName: "Puccinia sorghi",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Basidiomycota (Pucciniaceae)",
    riskIndex: 60,
    description: "Cinnamon-brown powdery pustules scattered across both leaf surfaces, often with chlorotic halos.",
    optimalConditions: "Cool (16–24°C), humid conditions with high relative humidity.",
    symptoms: ["Cinnamon-brown rust pustules", "Chlorotic halos around pustules", "Leaf tissue death", "Yield loss under heavy infection"],
    differentials: [{ name: "Corn - Gray Leaf Spot", probability: 0.12 }, { name: "Corn - Northern Leaf Blight", probability: 0.07 }],
    ...RX.fungal,
  },
  "Corn_(maize)___Northern_Leaf_Blight": {
    crop: "Corn (Maize)", disease: "Northern Leaf Blight",
    scientificName: "Exserohilum turcicum",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Pleosporaceae)",
    riskIndex: 64,
    description: "Long cigar-shaped gray-green lesions on lower leaves that expand upward and blight the canopy.",
    optimalConditions: "Moderate (18–27°C), prolonged dew and high humidity.",
    symptoms: ["Cigar-shaped gray-green lesions", "Tan to gray necrotic streaks", "Canopy blighting", "Reduced photosynthetic area"],
    differentials: [{ name: "Corn - Gray Leaf Spot", probability: 0.16 }, { name: "Corn - Common Rust", probability: 0.06 }],
    ...RX.fungal,
  },
  "Corn_(maize)___healthy": {
    crop: "Corn (Maize)", disease: "Healthy",
    scientificName: "Zea mays (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Healthy maize foliage with uniform green color and no lesions, rust, or blight symptoms.",
    optimalConditions: "Warm temperatures, adequate moisture, and balanced fertility.",
    symptoms: ["Uniform green leaves", "No lesions or pustules", "Normal tassel and ear development", "Vigorous growth"],
    differentials: [],
    ...RX.healthy,
  },

  // ------------------------------------------------ Grape
  "Grape___Black_rot": {
    crop: "Grape", disease: "Black Rot",
    scientificName: "Guignardia bidwellii",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Botryosphaeriaceae)",
    riskIndex: 67,
    description: "Brown circular leaf spots with dark margins and shriveled black 'mummy' berries; a serious grapevine disease.",
    optimalConditions: "Warm (24–30°C), humid conditions with rain events.",
    symptoms: ["Tan leaf spots with dark margins", "Black shriveled 'mummy' berries", "Cane lesions", "Premature fruit drop"],
    differentials: [{ name: "Grape - Leaf Blight (Isariopsis)", probability: 0.11 }, { name: "Grape - Esca (Black Measles)", probability: 0.06 }],
    ...RX.fungal,
  },
  "Grape___Esca_(Black_Measles)": {
    crop: "Grape", disease: "Esca (Black Measles)",
    scientificName: "Phaeomoniella chlamydospora (fungal complex)",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (complex)",
    riskIndex: 72,
    description: "Interveinal chlorotic 'tiger stripe' patterns on leaves and dark spots on berries, caused by a wood-rotting fungal complex.",
    optimalConditions: "Warm, dry seasons in older vines with wood infections.",
    symptoms: ["'Tiger stripe' interveinal chlorosis", "Dark 'black measles' spots on berries", "Shoot and cane dieback", "Internal wood necrosis"],
    differentials: [{ name: "Grape - Black Rot", probability: 0.10 }, { name: "Grape - Leaf Blight (Isariopsis)", probability: 0.07 }],
    ...RX.fungal,
  },
  "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
    crop: "Grape", disease: "Leaf Blight (Isariopsis Leaf Spot)",
    scientificName: "Pseudocercospora vitis",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Mycosphaerellaceae)",
    riskIndex: 54,
    description: "Angular dark-brown spots along leaf veins surrounded by yellow halos, causing defoliation.",
    optimalConditions: "Warm, humid conditions with frequent rain.",
    symptoms: ["Angular dark-brown leaf spots", "Yellow halos around spots", "Leaf defoliation", "Reduced vine vigor"],
    differentials: [{ name: "Grape - Black Rot", probability: 0.12 }, { name: "Grape - Downy Mildew", probability: 0.08 }],
    ...RX.fungal,
  },
  "Grape___healthy": {
    crop: "Grape", disease: "Healthy",
    scientificName: "Vitis vinifera (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Healthy grapevine foliage with normal green color and no spots, mildew, or rot symptoms.",
    optimalConditions: "Well-drained soil, full sun, and good air circulation.",
    symptoms: ["Uniform green leaves", "No spots or mildew", "Normal shoot growth", "Healthy cluster development"],
    differentials: [],
    ...RX.healthy,
  },

  // ------------------------------------------------ Orange
  "Orange___Haunglongbing_(Citrus_greening)": {
    crop: "Orange", disease: "Huanglongbing (Citrus Greening)",
    scientificName: "Candidatus Liberibacter asiaticus",
    pathogenType: "Bacterial", pathogenFamily: "Bacteria — Alphaproteobacteria (Liberibacter)",
    riskIndex: 88,
    description: "Blotchy asymmetric yellow mottling with small, lopsided, bitter fruit. Vectored by the Asian citrus psyllid; the most serious citrus disease worldwide.",
    optimalConditions: "Warm climates with high Asian citrus psyllid populations.",
    symptoms: ["Blotchy asymmetric leaf mottle", "Yellow shoots and twigs", "Small, lopsided bitter fruit", "Vein corking and tree decline"],
    differentials: [{ name: "Orange - Zinc Deficiency (mimic)", probability: 0.18 }, { name: "Orange - Citrus Canker", probability: 0.08 }],
    ...RX.bacterial,
  },

  // ------------------------------------------------ Peach
  "Peach___Bacterial_spot": {
    crop: "Peach", disease: "Bacterial Spot",
    scientificName: "Xanthomonas campestris pv. pruni",
    pathogenType: "Bacterial", pathogenFamily: "Bacteria — Gammaproteobacteria (Xanthomonadaceae)",
    riskIndex: 63,
    description: "Water-soaked angular spots on leaves and sunken lesions on fruit that scar the surface.",
    optimalConditions: "Warm, wet weather with wind-driven rain.",
    symptoms: ["Angular water-soaked leaf spots", "Sunken fruit lesions", "Defoliation of infected shoots", "Twig cankers"],
    differentials: [{ name: "Peach - Peach Scab", probability: 0.13 }, { name: "Peach - Brown Rot", probability: 0.07 }],
    ...RX.bacterial,
  },
  "Peach___healthy": {
    crop: "Peach", disease: "Healthy",
    scientificName: "Prunus persica (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Healthy peach foliage with normal green color and no spots or lesions.",
    optimalConditions: "Well-drained soil, full sun, and good airflow.",
    symptoms: ["Uniform green leaves", "No spotting or lesions", "Normal shoot growth", "Healthy fruit development"],
    differentials: [],
    ...RX.healthy,
  },

  // ------------------------------------------------ Pepper (Bell)
  "Pepper,_bell___Bacterial_spot": {
    crop: "Bell Pepper", disease: "Bacterial Spot",
    scientificName: "Xanthomonas campestris pv. vesicatoria",
    pathogenType: "Bacterial", pathogenFamily: "Bacteria — Gammaproteobacteria (Xanthomonadaceae)",
    riskIndex: 70,
    description: "Water-soaked spots that turn necrotic with yellow halos on leaves and raised scabby lesions on fruit.",
    optimalConditions: "Warm, humid conditions with rain splash and overhead irrigation.",
    symptoms: ["Necrotic leaf spots with yellow halos", "Raised scabby fruit lesions", "Defoliation", "Sunscald on exposed fruit"],
    differentials: [{ name: "Bell Pepper - Cercospora Leaf Spot", probability: 0.14 }, { name: "Bell Pepper - Healthy", probability: 0.06 }],
    ...RX.bacterial,
  },
  "Pepper,_bell___healthy": {
    crop: "Bell Pepper", disease: "Healthy",
    scientificName: "Capsicum annuum (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Healthy bell pepper foliage with normal green color and no lesions.",
    optimalConditions: "Warm temperatures, well-drained soil, and consistent moisture.",
    symptoms: ["Uniform green leaves", "No spotting or halos", "Normal flowering and fruit set", "Vigorous growth"],
    differentials: [],
    ...RX.healthy,
  },

  // ------------------------------------------------ Potato
  "Potato___Early_blight": {
    crop: "Potato", disease: "Early Blight",
    scientificName: "Alternaria solani",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Pleosporaceae)",
    riskIndex: 65,
    description: "Concentric 'target-board' lesions on older leaves during warm, humid weather; also affects stems and tubers.",
    optimalConditions: "Warm (24–29°C) alternating wet/dry conditions with humidity.",
    symptoms: ["Concentric 'target-board' leaf lesions", "Dark lesions on stems", "Brown spots on tubers", "Defoliation of lower canopy"],
    differentials: [{ name: "Potato - Late Blight", probability: 0.14 }, { name: "Potato - Septoria Leaf Spot", probability: 0.06 }],
    ...RX.fungal,
  },
  "Potato___Late_blight": {
    crop: "Potato", disease: "Late Blight",
    scientificName: "Phytophthora infestans",
    pathogenType: "Oomycete / Fungal", pathogenFamily: "Oomycota (Peronosporaceae)",
    riskIndex: 90,
    description: "The historic famine pathogen: fast-spreading water-soaked lesions with white sporulation that can destroy a crop in days.",
    optimalConditions: "Cool (10–24°C), wet conditions with prolonged leaf wetness.",
    symptoms: ["Water-soaked greasy lesions", "White downy sporulation on leaf undersides", "Rapid plant collapse", "Brown firm rot of tubers"],
    differentials: [{ name: "Potato - Early Blight", probability: 0.12 }, { name: "Potato - Bacterial Wilt", probability: 0.05 }],
    ...RX.oomycete,
  },
  "Potato___healthy": {
    crop: "Potato", disease: "Healthy",
    scientificName: "Solanum tuberosum (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Healthy potato foliage with uniform green color and no lesions or blight symptoms.",
    optimalConditions: "Cool temperatures, well-drained soil, and balanced fertility.",
    symptoms: ["Uniform green leaves", "No lesions or blight", "Normal tuber bulking", "Vigorous canopy"],
    differentials: [],
    ...RX.healthy,
  },

  // ------------------------------------------------ Raspberry
  "Raspberry___healthy": {
    crop: "Raspberry", disease: "Healthy",
    scientificName: "Rubus idaeus (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Healthy raspberry foliage with normal green color and no disease or pest symptoms.",
    optimalConditions: "Well-drained soil, full sun, and good air circulation.",
    symptoms: ["Uniform green leaves", "No spotting or mildew", "Normal cane growth", "Healthy berry formation"],
    differentials: [],
    ...RX.healthy,
  },

  // ------------------------------------------------ Soybean
  "Soybean___healthy": {
    crop: "Soybean", disease: "Healthy",
    scientificName: "Glycine max (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Healthy soybean foliage with normal green color and no lesions or pest damage.",
    optimalConditions: "Warm temperatures, adequate moisture, and balanced fertility.",
    symptoms: ["Uniform green leaves", "No lesions or spots", "Normal pod development", "Vigorous growth"],
    differentials: [],
    ...RX.healthy,
  },

  // ------------------------------------------------ Squash
  "Squash___Powdery_mildew": {
    crop: "Squash", disease: "Powdery Mildew",
    scientificName: "Podosphaera xanthii",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Erysiphaceae)",
    riskIndex: 52,
    description: "White talcum-like coating on upper leaf surfaces that spreads rapidly and reduces photosynthesis.",
    optimalConditions: "Warm days, cool nights, and moderate humidity; not rain-dependent.",
    symptoms: ["White powdery coating on leaves", "Leaf yellowing and browning", "Stunted plant growth", "Reduced fruit yield and quality"],
    differentials: [{ name: "Squash - Downy Mildew", probability: 0.13 }, { name: "Squash - Healthy", probability: 0.05 }],
    ...RX.fungal,
    chemicalPrescription: {
      ...RX.fungal.chemicalPrescription,
      activeIngredients: ['Wettable Sulphur 80% WP', 'Tebuconazole 25.9% EC', 'Myclobutanil 40% WP'],
      tradeNames: ['Sulfex', 'Folicur', 'Systhane'],
    },
  },

  // ------------------------------------------------ Strawberry
  "Strawberry___Leaf_scorch": {
    crop: "Strawberry", disease: "Leaf Scorch",
    scientificName: "Diplocarpon earlianum",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Drepanopezizaceae)",
    riskIndex: 57,
    description: "Purple-red leaf spots that merge into large scorched areas, weakening the plant and reducing yield.",
    optimalConditions: "Warm, humid conditions with frequent leaf wetness.",
    symptoms: ["Purple-red leaf spots", "Merging 'scorched' leaf margins", "Reduced plant vigor", "Lower berry yield"],
    differentials: [{ name: "Strawberry - Leaf Spot", probability: 0.16 }, { name: "Strawberry - Healthy", probability: 0.06 }],
    ...RX.fungal,
  },
  "Strawberry___healthy": {
    crop: "Strawberry", disease: "Healthy",
    scientificName: "Fragaria × ananassa (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Healthy strawberry foliage with uniform green color and no spots or scorch.",
    optimalConditions: "Well-drained soil, full sun, and good airflow.",
    symptoms: ["Uniform green leaves", "No spotting or scorch", "Normal runner growth", "Healthy berry formation"],
    differentials: [],
    ...RX.healthy,
  },

  // ------------------------------------------------ Tomato
  "Tomato___Bacterial_spot": {
    crop: "Tomato", disease: "Bacterial Spot",
    scientificName: "Xanthomonas campestris pv. vesicatoria",
    pathogenType: "Bacterial", pathogenFamily: "Bacteria — Gammaproteobacteria (Xanthomonadaceae)",
    riskIndex: 69,
    description: "Small water-soaked spots on leaves and fruit that turn scabby and reduce marketable yield.",
    optimalConditions: "Warm, humid conditions with rain splash and overhead irrigation.",
    symptoms: ["Small necrotic leaf spots", "Yellow halos around spots", "Raised scabby fruit lesions", "Defoliation"],
    differentials: [{ name: "Tomato - Early Blight", probability: 0.13 }, { name: "Tomato - Septoria Leaf Spot", probability: 0.09 }],
    ...RX.bacterial,
  },
  "Tomato___Early_blight": {
    crop: "Tomato", disease: "Early Blight",
    scientificName: "Alternaria solani",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Pleosporaceae)",
    riskIndex: 68,
    description: "Concentric 'bullseye' lesions on lower leaves; one of the most common tomato diseases in warm, humid weather.",
    optimalConditions: "Warm (24–29°C) alternating wet/dry conditions with high humidity.",
    symptoms: ["Concentric 'bullseye' leaf lesions", "Yellowing of lower leaves", "Dark stem lesions", "Fruit rot at the stem end"],
    differentials: [{ name: "Tomato - Septoria Leaf Spot", probability: 0.14 }, { name: "Tomato - Bacterial Spot", probability: 0.08 }],
    ...RX.fungal,
  },
  "Tomato___Late_blight": {
    crop: "Tomato", disease: "Late Blight",
    scientificName: "Phytophthora infestans",
    pathogenType: "Oomycete / Fungal", pathogenFamily: "Oomycota (Peronosporaceae)",
    riskIndex: 90,
    description: "Rapid water-soaked lesions with white sporulation; can destroy an entire tomato field within days under cool, wet conditions.",
    optimalConditions: "Cool (10–24°C), wet conditions with prolonged leaf wetness.",
    symptoms: ["Water-soaked greasy lesions", "White downy growth on undersides", "Rapid plant collapse", "Brown firm rot on fruit"],
    differentials: [{ name: "Tomato - Early Blight", probability: 0.11 }, { name: "Tomato - Gray Mold", probability: 0.05 }],
    ...RX.oomycete,
  },
  "Tomato___Leaf_Mold": {
    crop: "Tomato", disease: "Leaf Mold",
    scientificName: "Passalora fulva",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Mycosphaerellaceae)",
    riskIndex: 60,
    description: "Pale yellow spots on upper leaf surfaces with olive-brown velvety mold below; common in greenhouse tomato production.",
    optimalConditions: "High humidity (>85%) and moderate temperatures in greenhouses.",
    symptoms: ["Pale yellow upper-leaf spots", "Olive-brown velvety mold beneath", "Leaf drop", "Reduced fruit yield"],
    differentials: [{ name: "Tomato - Early Blight", probability: 0.12 }, { name: "Tomato - Powdery Mildew", probability: 0.07 }],
    ...RX.fungal,
  },
  "Tomato___Septoria_leaf_spot": {
    crop: "Tomato", disease: "Septoria Leaf Spot",
    scientificName: "Septoria lycopersici",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Mycosphaerellaceae)",
    riskIndex: 62,
    description: "Numerous small circular spots with dark margins and gray centers on lower leaves, leading to defoliation.",
    optimalConditions: "Warm, wet conditions with rain splash.",
    symptoms: ["Small gray-centered leaf spots", "Dark margins with yellow halos", "Lower leaf yellowing", "Progressive defoliation"],
    differentials: [{ name: "Tomato - Early Blight", probability: 0.15 }, { name: "Tomato - Bacterial Spot", probability: 0.08 }],
    ...RX.fungal,
  },
  "Tomato___Spider_mites Two-spotted_spider_mite": {
    crop: "Tomato", disease: "Two-Spotted Spider Mite",
    scientificName: "Tetranychus urticae",
    pathogenType: "Pest (Arthropod)", pathogenFamily: "Arthropoda — Arachnida (Tetranychidae)",
    riskIndex: 61,
    description: "Fine stippling and webbing on leaves; mites feed on cell sap, causing bronzed, dry foliage.",
    optimalConditions: "Hot, dry conditions; populations explode under drought stress.",
    symptoms: ["Chlorotic stippling on leaves", "Fine webbing on undersides", "Bronzing and drying of foliage", "Premature leaf drop"],
    differentials: [{ name: "Tomato - Broad Mite", probability: 0.14 }, { name: "Tomato - Early Blight", probability: 0.06 }],
    ...RX.pest,
  },
  "Tomato___Target_Spot": {
    crop: "Tomato", disease: "Target Spot",
    scientificName: "Corynespora cassiicola",
    pathogenType: "Fungal", pathogenFamily: "Fungi — Ascomycota (Corynesporascaceae)",
    riskIndex: 59,
    description: "Round brown lesions with concentric rings on leaves and fruit, similar to early blight but often smaller.",
    optimalConditions: "Warm, humid conditions with extended leaf wetness.",
    symptoms: ["Round brown concentric lesions", "Lesions on fruit and stems", "Leaf defoliation", "Reduced yield"],
    differentials: [{ name: "Tomato - Early Blight", probability: 0.18 }, { name: "Tomato - Septoria Leaf Spot", probability: 0.06 }],
    ...RX.fungal,
  },
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
    crop: "Tomato", disease: "Tomato Yellow Leaf Curl Virus (TYLCV)",
    scientificName: "Tomato yellow leaf curl virus",
    pathogenType: "Viral", pathogenFamily: "Virus — Geminiviridae (Begomovirus)",
    riskIndex: 85,
    description: "Upward cupping and yellowing of leaves with severe stunting; exclusively vectored by the whitefly Bemisia tabaci.",
    optimalConditions: "Warm climates with high whitefly populations.",
    symptoms: ["Upward leaf cupping and curling", "Chlorotic yellow margins", "Severe plant stunting", "Flower drop and reduced fruit set"],
    differentials: [{ name: "Tomato - Tomato Mosaic Virus", probability: 0.16 }, { name: "Tomato - Herbicide Injury", probability: 0.07 }],
    ...RX.viral,
  },
  "Tomato___Tomato_mosaic_virus": {
    crop: "Tomato", disease: "Tomato Mosaic Virus (ToMV)",
    scientificName: "Tomato mosaic virus",
    pathogenType: "Viral", pathogenFamily: "Virus — Virgaviridae (Tobamovirus)",
    riskIndex: 78,
    description: "Mottled light/dark green mosaic patterns on leaves; highly contagious and spread by contact, tools, and seed.",
    optimalConditions: "Mechanical transmission; persists in contaminated seed, soil, and tools.",
    symptoms: ["Mosaic mottling on leaves", "Leaf distortion and narrowing", "Plant stunting", "Fruit discoloration and reduced yield"],
    differentials: [{ name: "Tomato - TYLCV", probability: 0.15 }, { name: "Tomato - Nutrient Deficiency", probability: 0.07 }],
    ...RX.viral,
  },
  "Tomato___healthy": {
    crop: "Tomato", disease: "Healthy",
    scientificName: "Solanum lycopersicum (healthy foliage)",
    pathogenType: "Healthy", pathogenFamily: "Agricultural — Healthy Canopy",
    riskIndex: 4,
    description: "Healthy tomato foliage with uniform green color and no lesions, spots, or pest damage.",
    optimalConditions: "Warm temperatures, well-drained soil, and balanced fertility.",
    symptoms: ["Uniform green leaves", "No lesions or spots", "Normal flowering and fruit set", "Vigorous growth"],
    differentials: [],
    ...RX.healthy,
  },
};

// ---------------------------------------------------------------------------
// Tolerant lookup helpers
// ---------------------------------------------------------------------------
function normalizeClassId(id) {
  return String(id || '')
    .toLowerCase()
    .replace(/\(including_sour\)/g, ' ')
    .replace(/\(including sour\)/g, ' ')
    .replace(/\(maize\)/g, ' ')
    .replace(/\(black_measles\)/g, ' ')
    .replace(/\(isariopsis_leaf_spot\)/g, ' ')
    .replace(/\(citrus_greening\)/g, ' ')
    .replace(/[(),_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Precompute a normalized index once.
const NORMALIZED_INDEX = Object.keys(PLANT_DISEASES).reduce((acc, key) => {
  acc[normalizeClassId(key)] = key;
  return acc;
}, {});

const GENERIC_FALLBACK = {
  crop: "Unknown Crop", disease: "Unclassified Foliar Condition",
  scientificName: "Unknown pathogen",
  pathogenType: "Fungal", pathogenFamily: "Undetermined",
  riskIndex: 50,
  description: "The model could not confidently map this specimen to a known PlantVillage class. Consult an agronomist for manual confirmation.",
  optimalConditions: "Unknown.",
  symptoms: ["Ambiguous foliar symptoms", "Recommend expert manual inspection"],
  differentials: [],
  ...RX.fungal,
};

/**
 * Resolve a disease entry from any class id string (direct, normalized, or fuzzy).
 */
export function getDiseaseDetails(classId) {
  if (!classId) return GENERIC_FALLBACK;

  // 1. Direct hit
  if (PLANT_DISEASES[classId]) return PLANT_DISEASES[classId];

  // 2. Normalized hit
  const norm = normalizeClassId(classId);
  if (NORMALIZED_INDEX[norm]) return PLANT_DISEASES[NORMALIZED_INDEX[norm]];

  // 3. Fuzzy: one normalized key contains the other
  const keys = Object.keys(NORMALIZED_INDEX);
  const partial = keys.find((k) => k.includes(norm) || norm.includes(k));
  if (partial) return PLANT_DISEASES[NORMALIZED_INDEX[partial]];

  return GENERIC_FALLBACK;
}

export default PLANT_DISEASES;
