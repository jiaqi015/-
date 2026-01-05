
import { useState } from 'react';
import { DevelopSession, DevelopMode } from '../../domain/types';
import { WorkflowStep } from '../../application/ports';
import { developPhotoUseCase } from '../../infrastructure/container';

export const useDevelopWorkflow = (onSuccess: () => void) => {
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('ANALYZING_OPTICS');
  const [result, setResult] = useState<{ session: DevelopSession; url: string } | null>(null);

  const handleDevelop = async (
    sourceImage: string | null,
    selectedCameraId: string | null,
    intensity: number,
    developMode: DevelopMode
  ) => {
    if (!sourceImage || !selectedCameraId) return;
    try {
      setIsDeveloping(true);
      const { session } = await developPhotoUseCase.execute(
        sourceImage, 
        selectedCameraId, 
        intensity,
        developMode,
        (step) => setCurrentStep(step)
      );
      setResult({ session, url: session.outputUrl });
      onSuccess();
    } catch (error: any) {
      console.error("显影引擎故障:", error);
      throw error;
    } finally {
      setIsDeveloping(false);
    }
  };

  const resetResult = () => setResult(null);

  return {
    isDeveloping,
    currentStep,
    result,
    setResult,
    handleDevelop,
    resetResult
  };
};
