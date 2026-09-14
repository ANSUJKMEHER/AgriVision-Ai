/**
 * AgriVision AI — Curated 1-Click Evaluation Leaves
 * =================================================
 * Bundled PlantVillage sample specimens (images in /public/samples) so the
 * demo works offline. `classId` matches the keys in plantDiseasesData.js.
 *
 * `focalPoints` are normalized (x, y ∈ [0,1]) lesion anchors used by the
 * client-side Grad-CAM visualizer to seed activation hotspots.
 */

export const SAMPLE_LEAVES = [
  {
    id: "tomato-early-blight",
    imageUrl: "/samples/tomato_early_blight.jpg",
    crop: "Tomato",
    title: "Tomato Early Blight",
    classId: "Tomato___Early_blight",
    confidence: 0.984,
    focalPoints: [
      { x: 0.42, y: 0.38, radius: 70, intensity: 0.95 },
      { x: 0.60, y: 0.55, radius: 55, intensity: 0.82 },
      { x: 0.35, y: 0.62, radius: 50, intensity: 0.70 },
    ],
  },
  {
    id: "potato-late-blight",
    imageUrl: "/samples/potato_late_blight.jpg",
    crop: "Potato",
    title: "Potato Late Blight",
    classId: "Potato___Late_blight",
    confidence: 0.976,
    focalPoints: [
      { x: 0.48, y: 0.40, radius: 80, intensity: 0.95 },
      { x: 0.62, y: 0.58, radius: 60, intensity: 0.80 },
    ],
  },
  {
    id: "corn-common-rust",
    imageUrl: "/samples/corn_common_rust.jpg",
    crop: "Corn",
    title: "Corn Common Rust",
    classId: "Corn_(maize)___Common_rust_",
    confidence: 0.971,
    focalPoints: [
      { x: 0.38, y: 0.34, radius: 45, intensity: 0.90 },
      { x: 0.56, y: 0.46, radius: 45, intensity: 0.85 },
      { x: 0.68, y: 0.30, radius: 40, intensity: 0.75 },
    ],
  },
  {
    id: "grape-black-rot",
    imageUrl: "/samples/grape_black_rot.jpg",
    crop: "Grape",
    title: "Grape Black Rot",
    classId: "Grape___Black_rot",
    confidence: 0.965,
    focalPoints: [
      { x: 0.46, y: 0.42, radius: 65, intensity: 0.92 },
      { x: 0.60, y: 0.56, radius: 55, intensity: 0.78 },
    ],
  },
  {
    id: "pepper-bacterial-spot",
    imageUrl: "/samples/pepper_bacterial_spot.jpg",
    crop: "Bell Pepper",
    title: "Bell Pepper Bacterial Spot",
    classId: "Pepper,_bell___Bacterial_spot",
    confidence: 0.958,
    focalPoints: [
      { x: 0.44, y: 0.40, radius: 60, intensity: 0.90 },
      { x: 0.58, y: 0.52, radius: 50, intensity: 0.76 },
    ],
  },
  {
    id: "tomato-healthy",
    imageUrl: "/samples/tomato_healthy.jpg",
    crop: "Tomato",
    title: "Tomato Healthy",
    classId: "Tomato___healthy",
    confidence: 0.992,
    focalPoints: [],
  },
  {
    id: "strawberry-leaf-scorch",
    imageUrl: "/samples/strawberry_leaf_scorch.jpg",
    crop: "Strawberry",
    title: "Strawberry Leaf Scorch",
    classId: "Strawberry___Leaf_scorch",
    confidence: 0.949,
    focalPoints: [
      { x: 0.40, y: 0.36, radius: 55, intensity: 0.88 },
      { x: 0.58, y: 0.50, radius: 50, intensity: 0.74 },
    ],
  },
  {
    id: "apple-cedar-rust",
    imageUrl: "/samples/apple_cedar_rust.jpg",
    crop: "Apple",
    title: "Apple Cedar Apple Rust",
    classId: "Apple___Cedar_apple_rust",
    confidence: 0.961,
    focalPoints: [
      { x: 0.46, y: 0.40, radius: 65, intensity: 0.93 },
      { x: 0.60, y: 0.54, radius: 55, intensity: 0.79 },
    ],
  },
  {
    id: "tomato-tylcv",
    imageUrl: "/samples/tomato_tylcv.jpg",
    crop: "Tomato",
    title: "Tomato Yellow Leaf Curl Virus",
    classId: "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    confidence: 0.955,
    focalPoints: [
      { x: 0.42, y: 0.38, radius: 70, intensity: 0.90 },
      { x: 0.58, y: 0.52, radius: 55, intensity: 0.75 },
    ],
  },
  {
    id: "peach-bacterial-spot",
    imageUrl: "/samples/peach_bacterial_spot.jpg",
    crop: "Peach",
    title: "Peach Bacterial Spot",
    classId: "Peach___Bacterial_spot",
    confidence: 0.953,
    focalPoints: [
      { x: 0.44, y: 0.40, radius: 60, intensity: 0.89 },
      { x: 0.58, y: 0.54, radius: 50, intensity: 0.75 },
    ],
  },
];

export default SAMPLE_LEAVES;
