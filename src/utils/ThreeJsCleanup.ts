import * as THREE from 'three';

/**
 * ThreeJsCleanup
 *
 * Utility functions for properly disposing Three.js resources
 * to prevent memory leaks (geometries, materials, textures)
 */

/**
 * Dispose a material and all its textures
 */
export function disposeMaterial(material: THREE.Material): void {
  // Dispose textures if they exist
  const mat = material as any;
  if (mat.map) mat.map.dispose();
  if (mat.lightMap) mat.lightMap.dispose();
  if (mat.bumpMap) mat.bumpMap.dispose();
  if (mat.normalMap) mat.normalMap.dispose();
  if (mat.specularMap) mat.specularMap.dispose();
  if (mat.envMap) mat.envMap.dispose();
  if (mat.alphaMap) mat.alphaMap.dispose();
  if (mat.aoMap) mat.aoMap.dispose();
  if (mat.displacementMap) mat.displacementMap.dispose();
  if (mat.emissiveMap) mat.emissiveMap.dispose();
  if (mat.gradientMap) mat.gradientMap.dispose();
  if (mat.metalnessMap) mat.metalnessMap.dispose();
  if (mat.roughnessMap) mat.roughnessMap.dispose();

  // Dispose the material itself
  material.dispose();
}

/**
 * Dispose all geometries and materials in a Three.js Object3D hierarchy
 */
export function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Dispose geometry
      if (child.geometry) {
        child.geometry.dispose();
      }

      // Dispose materials
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            disposeMaterial(mat);
          });
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
}

/**
 * Cleanup an AnimationMixer
 */
export function disposeAnimationMixer(mixer: THREE.AnimationMixer): void {
  mixer.stopAllAction();
  mixer.uncacheRoot(mixer.getRoot());
}
