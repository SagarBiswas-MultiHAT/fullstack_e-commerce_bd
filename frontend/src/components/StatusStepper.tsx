const ORDER_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'] as const;

interface StatusStepperProps {
  status: string;
}

function normalizeStatus(status: string) {
  const value = status.toLowerCase();
  const index = ORDER_STEPS.indexOf(value as (typeof ORDER_STEPS)[number]);
  return index;
}

export function StatusStepper({ status }: StatusStepperProps) {
  const currentStepIndex = normalizeStatus(status);

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      {ORDER_STEPS.map((step, index) => {
        const isCompleted = currentStepIndex >= index;
        const isCurrent = currentStepIndex === index;

        return (
          <div key={step} className="flex flex-1 items-center gap-2">
            <div
              className={[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase',
                isCompleted
                  ? 'border-fg bg-fg text-bg'
                  : 'border-outline bg-panel text-muted',
              ].join(' ')}
            >
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs uppercase tracking-wide ${isCurrent ? 'text-fg' : 'text-muted'}`}>
                {step}
              </p>
              {index < ORDER_STEPS.length - 1 ? (
                <div
                  className={`mt-1 h-1 rounded-full ${isCompleted ? 'bg-fg' : 'bg-outline'}`}
                  aria-hidden
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
