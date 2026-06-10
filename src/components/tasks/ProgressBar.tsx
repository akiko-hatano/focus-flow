type ProgressBarProps = {
  progress: number;
};

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="mb-stack-lg" data-testid="progress-bar">
      <div className="flex justify-between items-center mb-2">
        <span className="text-label-md text-primary">Daily Progress</span>
        <span className="text-label-md text-on-surface-variant" data-testid="progress-text">
          {progress}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
