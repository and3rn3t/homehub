import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useKV } from '@/hooks/use-kv'
import { ArrowRight, Cursor, LightbulbIcon, PlayIcon, XIcon } from '@/lib/icons'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: any
  position: { x: number; y: number }
  highlight?: string
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Flow Designer',
    description:
      "Create powerful automation workflows with our visual drag-and-drop interface. Let's get started!",
    icon: Lightbulb,
    position: { x: 50, y: 50 },
  },
  {
    id: 'palette',
    title: 'Open the Node Palette',
    description:
      'Click "Add Node" to open the palette and see all available automation building blocks.',
    icon: Cursor,
    position: { x: 20, y: 20 },
    highlight: 'add-node-button',
  },
  {
    id: 'drag',
    title: 'Drag to Create',
    description: 'Drag nodes from the palette onto the canvas to build your automation workflow.',
    icon: ArrowRight,
    position: { x: 30, y: 60 },
  },
  {
    id: 'connect',
    title: 'Connect Nodes',
    description:
      'Click "Out" on one node and "In" on another to create logical connections between steps.',
    icon: ArrowRight,
    position: { x: 70, y: 40 },
  },
  {
    id: 'configure',
    title: 'Configure Settings',
    description:
      'Click any node to configure its specific settings like times, devices, or conditions.',
    icon: Cursor,
    position: { x: 80, y: 70 },
  },
  {
    id: 'test',
    title: 'Test Your Flow',
    description: 'Use the "Test" button to run your automation and see if it works as expected.',
    icon: Play,
    position: { x: 50, y: 30 },
  },
]

interface FlowTutorialProps {
  onComplete: () => void
}

export function FlowTutorial({ onComplete }: FlowTutorialProps) {
  const [hasSeenTutorial, setHasSeenTutorial] = useKV('flow-tutorial-seen', false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(!hasSeenTutorial)

  if (hasSeenTutorial || !isVisible) return null

  const currentStepData = tutorialSteps[currentStep]

  if (!currentStepData) {
    return null
  }

  const isLastStep = currentStep === tutorialSteps.length - 1

  const nextStep = () => {
    if (isLastStep) {
      completeTutorial()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const completeTutorial = () => {
    setHasSeenTutorial(true)
    setIsVisible(false)
    onComplete()
  }

  const skipTutorial = () => {
    setHasSeenTutorial(true)
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
          />

          {/* Tutorial Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute z-50"
            style={{
              left: `${currentStepData.position.x}%`,
              top: `${currentStepData.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Card className="border-primary w-80 border-2 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-full">
                      <currentStepData.icon size={20} className="text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{currentStepData.title}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {currentStep + 1} of {tutorialSteps.length}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={skipTutorial} className="h-8 w-8">
                    <X size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4 text-sm">{currentStepData.description}</p>

                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={skipTutorial}>
                    Skip Tutorial
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(currentStep - 1)}
                      >
                        Back
                      </Button>
                    )}
                    <Button size="sm" onClick={nextStep} className="flex items-center gap-2">
                      {isLastStep ? 'Finish' : 'Next'}
                      {!isLastStep && <ArrowRight size={14} />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Progress Dots */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-1/2 z-50 -translate-x-1/2 transform"
          >
            <div className="bg-background/90 flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-primary'
                      : index < currentStep
                        ? 'bg-primary/50'
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
