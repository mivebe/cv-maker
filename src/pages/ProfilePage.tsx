import { BasicsEditor } from '../components/editors/BasicsEditor'
import { ExperienceEditor } from '../components/editors/ExperienceEditor'
import { EducationEditor } from '../components/editors/EducationEditor'
import { SkillsEditor } from '../components/editors/SkillsEditor'
import { ProjectsEditor } from '../components/editors/ProjectsEditor'
import { CustomSectionsEditor } from '../components/editors/CustomSectionsEditor'

export function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Master Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your complete CV content, entered once. Every variant draws from this.
          Changes save automatically.
        </p>
      </div>
      <BasicsEditor />
      <ExperienceEditor />
      <EducationEditor />
      <SkillsEditor />
      <ProjectsEditor />
      <CustomSectionsEditor />
    </div>
  )
}
