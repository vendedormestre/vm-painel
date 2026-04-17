import { FilaFeedback } from './FilaFeedback'
import { QualidadeCanais } from './QualidadeCanais'

export function FeedbackModule() {
  return (
    <div className="flex flex-col gap-5">
      <FilaFeedback />
      <QualidadeCanais />
    </div>
  )
}
