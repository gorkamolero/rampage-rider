/**
 * Skeleton Verification Script
 *
 * Loads a pedestrian GLTF model and inspects its skeleton structure
 * to verify bone count and hierarchy.
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

const loader = new GLTFLoader();

// Load one pedestrian model
loader.load('/assets/pedestrians/Casual_Male.gltf', (gltf) => {
  console.log('=== Pedestrian Skeleton Analysis ===\n');

  let skeletonFound = false;
  let boneCount = 0;
  const boneNames = [];

  gltf.scene.traverse((node) => {
    if (node.isSkinnedMesh) {
      skeletonFound = true;
      const skeleton = node.skeleton;
      boneCount = skeleton.bones.length;

      console.log(`✅ Found SkinnedMesh: ${node.name}`);
      console.log(`   Bone Count: ${boneCount}`);
      console.log(`   Geometry: ${node.geometry.attributes.position.count} vertices\n`);

      console.log('Bone Hierarchy:');
      skeleton.bones.forEach((bone, i) => {
        const indent = '  '.repeat(getDepth(bone));
        boneNames.push(bone.name);
        console.log(`${indent}[${i}] ${bone.name}`);
      });

      console.log('\n=== Bone Names (for comparison) ===');
      console.log(JSON.stringify(boneNames, null, 2));
    }
  });

  if (!skeletonFound) {
    console.log('❌ No skeleton found in model!');
  }

  console.log('\n=== Animations ===');
  gltf.animations.forEach((clip, i) => {
    console.log(`[${i}] ${clip.name} (${clip.duration.toFixed(2)}s, ${clip.tracks.length} tracks)`);
  });

}, undefined, (error) => {
  console.error('Failed to load model:', error);
});

function getDepth(bone) {
  let depth = 0;
  let current = bone;
  while (current.parent && current.parent.type === 'Bone') {
    depth++;
    current = current.parent;
  }
  return depth;
}
