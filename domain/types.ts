
export type CameraIconType = 'svg' | 'emoji' | 'ai-generated';
export type DevelopMode = 'DIRECT' | 'AGENTIC';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface DevelopManifest {
  diagnostic: string;
  tasks: string[];
  focusAreas: string[];
  requiredKnowledge: string[];
  auditCriteria: string;
}

export interface OpticalProperties {
  microContrast: 'high' | 'medium' | 'soft';
  chromaticAberration: 'none' | 'vintage' | 'controlled';
  highlightRollOff: 'silky' | 'hard' | 'natural';
  shadowDepth: 'crushed' | 'detailed' | 'organic';
  colorScience: 'neutral' | 'warm' | 'cool' | 'vibrant' | 'muted';
}

export interface CameraRecipe {
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  grainAmount: number;
  vignetteAmount: number;
  clarity?: number;
  grayscale?: boolean;
  opticalProps?: OpticalProperties;
}

export interface CameraProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  designNotes: string;
  icon: {
    type: CameraIconType;
    value: string;
  };
  promptTemplate: string;
  recipe: CameraRecipe;
}

export interface DevelopSession {
  sessionId: string;
  cameraId: string;
  cameraName: string;
  createdAt: Date;
  inputImageHash?: string;
  outputMeta: {
    width: number;
    height: number;
    intensity: number;
    mode: DevelopMode;
    promptUsed: string;
    sources?: GroundingSource[];
    manifest?: DevelopManifest;
  };
  outputUrl: string;
}

export interface DevelopResult {
  session: DevelopSession;
  blob: Blob;
}
