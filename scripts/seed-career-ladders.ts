import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ---------- Types ----------

interface LevelDefinitionInsert {
  matrix_id: string
  level_code: string
  level_name: string
  level_order: number
  scope: { summary: string; collaborative_reach: string }
  technical_expectations: string[]
  leadership_expectations: string[]
  collaboration_expectations: string[]
  visibility_expectations: string[]
}

// ---------- Shared helper ----------

function mapToLevelDefinition(
  matrixId: string,
  levelCode: string,
  levelName: string,
  levelOrder: number,
  scope: { summary: string; collaborative_reach: string },
  technical: string[],
  leadership: string[],
  collaboration: string[],
  visibility: string[]
): LevelDefinitionInsert {
  return {
    matrix_id: matrixId,
    level_code: levelCode,
    level_name: levelName,
    level_order: levelOrder,
    scope,
    technical_expectations: technical,
    leadership_expectations: leadership,
    collaboration_expectations: collaboration,
    visibility_expectations: visibility,
  }
}

// ---------- Dropbox ----------

function parseDropboxLevels(matrixId: string, levels: Record<string, any>): LevelDefinitionInsert[] {
  const orderedCodes = ['IC1', 'IC2', 'IC3', 'IC4', 'IC5', 'IC6', 'IC7']
  return orderedCodes.map((code, idx) => {
    const level = levels[code]
    if (!level) return null

    // Craft -> technical_expectations
    const craft = level.craft || {}
    const technical = Object.values(craft).filter((v): v is string => typeof v === 'string' && !v.startsWith('Expectations do not exceed') && !v.startsWith('No escalation'))

    // Talent -> leadership_expectations
    const talent = level.talent || {}
    const leadership = Object.values(talent).filter((v): v is string => typeof v === 'string')

    // Culture -> collaboration_expectations
    const culture = level.culture || {}
    const collaboration = Object.values(culture).filter((v): v is string => typeof v === 'string')

    // Direction -> visibility_expectations
    const direction = level.direction || {}
    const visibility = Object.values(direction).filter((v): v is string => typeof v === 'string')

    // Results -> add to technical (impact/ownership/decision-making are core execution)
    const results = level.results || {}
    const resultsArr = Object.values(results).filter((v): v is string => typeof v === 'string')

    return mapToLevelDefinition(
      matrixId,
      code,
      `${level.title} (${code})`,
      idx,
      {
        summary: level.scope || level.summary || '',
        collaborative_reach: level.collaborative_reach || '',
      },
      [...technical, ...resultsArr],
      leadership,
      collaboration,
      visibility
    )
  }).filter((l): l is LevelDefinitionInsert => l !== null)
}

// ---------- Etsy ----------

function parseEtsyLevels(matrixId: string, levels: Record<string, any>): LevelDefinitionInsert[] {
  const orderedKeys = [
    'Engineer I',
    'Engineer II',
    'Senior Engineer I',
    'Senior Engineer II',
    'Staff Engineer I',
    'Staff Engineer II',
    'Senior Staff Engineer',
    'Principal Engineer',
  ]

  return orderedKeys.map((key, idx) => {
    const level = levels[key]
    if (!level) return null

    const details = level.competencies_detail || {}

    // delivery + domain_expertise + problem_solving -> technical
    const technical: string[] = [
      ...(details.delivery?.expectations || []),
      ...(details.domain_expertise?.expectations || []),
      ...(details.problem_solving?.expectations || []),
    ]

    // leadership
    const leadership: string[] = details.leadership?.expectations || []

    // communication -> collaboration
    const collaboration: string[] = details.communication?.expectations || []

    // For levels without competencies_detail, use summary
    if (technical.length === 0 && level.competency_profile) {
      technical.push(`Competency profile: ${level.competency_profile}`)
    }

    const levelCode = key.replace(/\s+/g, '_').toUpperCase()

    return mapToLevelDefinition(
      matrixId,
      levelCode,
      level.title,
      idx,
      {
        summary: level.scope || level.summary || '',
        collaborative_reach: level.collaboration || level.competency_profile || '',
      },
      technical,
      leadership,
      collaboration,
      []
    )
  }).filter((l): l is LevelDefinitionInsert => l !== null)
}

// ---------- Generic Templates ----------

function createGenericFAANG(matrixId: string): LevelDefinitionInsert[] {
  const levels = [
    { code: 'L3', name: 'Software Engineer (L3)', order: 0, scope: 'Completes well-defined tasks within a team', reach: 'Individual contributor within team', tech: ['Writes clean, tested code', 'Participates in code reviews', 'Learns from senior engineers'], lead: ['Seeks feedback actively', 'Acts on mentorship'], collab: ['Communicates status clearly', 'Collaborates with team'], vis: ['Visible within immediate team'] },
    { code: 'L4', name: 'Software Engineer (L4)', order: 1, scope: 'Independently delivers features and small projects', reach: 'Team with some cross-team interaction', tech: ['Owns features end-to-end', 'Designs and implements medium-complexity solutions', 'Debugs effectively across systems'], lead: ['Mentors junior engineers', 'Provides constructive code reviews'], collab: ['Works across functions', 'Communicates tradeoffs clearly'], vis: ['Known contributor within team and adjacent teams'] },
    { code: 'L5', name: 'Senior Software Engineer (L5)', order: 2, scope: 'Leads projects and enables team effectiveness', reach: 'Multi-team scope', tech: ['Designs scalable systems', 'Makes sound technical tradeoffs', 'Reduces technical debt strategically'], lead: ['Mentors and grows engineers', 'Sets technical direction for projects'], collab: ['Drives alignment across teams', 'Navigates disagreements productively'], vis: ['Recognized technical contributor across organization'] },
    { code: 'L6', name: 'Staff Software Engineer (L6)', order: 3, scope: 'Sets technical direction for domain or product area', reach: 'Organization-wide influence', tech: ['Defines architecture for critical systems', 'Identifies and solves systemic problems', 'Creates reusable patterns and frameworks'], lead: ['Grows senior engineers into leads', 'Shapes team culture and practices'], collab: ['Builds consensus on technical strategy', 'Influences product direction'], vis: ['Go-to technical leader in domain'] },
    { code: 'L7+', name: 'Principal/Distinguished Engineer (L7+)', order: 4, scope: 'Defines company-wide technical vision and strategy', reach: 'Company-wide and industry impact', tech: ['Makes decisions affecting company technical direction', 'Solves novel problems with industry-wide impact', 'Drives innovation in core technical areas'], lead: ['Attracts and retains top talent', 'Shapes engineering culture company-wide'], collab: ['Influences executive decisions', 'Represents company externally'], vis: ['Industry-recognized technical leader'] },
  ]

  return levels.map(l => mapToLevelDefinition(matrixId, l.code, l.name, l.order,
    { summary: l.scope, collaborative_reach: l.reach },
    l.tech, l.lead, l.collab, l.vis
  ))
}

function createGenericStartup(matrixId: string): LevelDefinitionInsert[] {
  const levels = [
    { code: 'JUNIOR', name: 'Junior Engineer', order: 0, scope: 'Delivers tasks with guidance in a fast-paced environment', reach: 'Within team', tech: ['Ships features quickly with guidance', 'Learns the full stack rapidly', 'Writes tests for own code'], lead: ['Takes initiative on small improvements'], collab: ['Communicates blockers early', 'Pairs with teammates effectively'], vis: ['Contributes to team standups'] },
    { code: 'MID', name: 'Mid-Level Engineer', order: 1, scope: 'Owns features independently and ships rapidly', reach: 'Cross-functional within startup', tech: ['Owns full features from design to deployment', 'Makes pragmatic technical decisions under time pressure', 'Handles on-call and production issues'], lead: ['Onboards new team members', 'Champions best practices'], collab: ['Works directly with product and design', 'Communicates technical constraints to non-technical stakeholders'], vis: ['Trusted to represent engineering in cross-functional discussions'] },
    { code: 'SENIOR', name: 'Senior Engineer', order: 2, scope: 'Technical leader driving key product decisions', reach: 'Company-wide technical influence', tech: ['Architects systems for scale and iteration speed', 'Balances technical debt with shipping velocity', 'Defines technical standards and patterns'], lead: ['Mentors engineers across the company', 'Drives hiring and technical interviews'], collab: ['Partners with founders on technical strategy', 'Translates business goals into technical roadmaps'], vis: ['Key technical voice in company decisions'] },
    { code: 'STAFF', name: 'Staff Engineer', order: 3, scope: 'Defines technical strategy enabling company growth', reach: 'Company-wide and external', tech: ['Designs systems that scale 10-100x', 'Makes build-vs-buy decisions', 'Drives major technical migrations'], lead: ['Builds and develops engineering teams', 'Sets engineering culture and values'], collab: ['Influences company strategy through technical lens', 'Builds partnerships with external teams'], vis: ['Represents company technical brand externally'] },
  ]

  return levels.map(l => mapToLevelDefinition(matrixId, l.code, l.name, l.order,
    { summary: l.scope, collaborative_reach: l.reach },
    l.tech, l.lead, l.collab, l.vis
  ))
}

function createGenericMidsize(matrixId: string): LevelDefinitionInsert[] {
  const levels = [
    { code: 'JUNIOR', name: 'Junior Engineer', order: 0, scope: 'Completes defined tasks with mentorship', reach: 'Within team', tech: ['Delivers bug fixes and small features', 'Follows established patterns', 'Writes unit tests'], lead: ['Seeks feedback proactively'], collab: ['Asks clarifying questions', 'Participates in team ceremonies'], vis: ['Known within immediate team'] },
    { code: 'MID', name: 'Mid-Level Engineer', order: 1, scope: 'Delivers features independently within team', reach: 'Team with some cross-team work', tech: ['Designs and implements features end-to-end', 'Conducts thorough code reviews', 'Understands system architecture'], lead: ['Mentors junior engineers', 'Takes ownership of on-call'], collab: ['Collaborates across teams for integrations', 'Documents decisions and tradeoffs'], vis: ['Recognized contributor beyond immediate team'] },
    { code: 'SENIOR', name: 'Senior Engineer', order: 2, scope: 'Leads projects and improves team practices', reach: 'Multi-team influence', tech: ['Designs scalable, maintainable systems', 'Makes sound architectural decisions', 'Champions testing and reliability'], lead: ['Grows team members through mentorship', 'Drives technical decisions'], collab: ['Aligns teams on shared technical direction', 'Facilitates productive technical discussions'], vis: ['Sought out for expertise across department'] },
    { code: 'STAFF', name: 'Staff Engineer', order: 3, scope: 'Sets technical direction for department', reach: 'Department-wide influence', tech: ['Defines architecture patterns used across teams', 'Solves cross-cutting technical challenges', 'Drives platform and infrastructure improvements'], lead: ['Develops senior engineers into leads', 'Shapes engineering practices and culture'], collab: ['Builds consensus across departments', 'Partners with product leadership'], vis: ['Technical authority across the organization'] },
    { code: 'PRINCIPAL', name: 'Principal Engineer', order: 4, scope: 'Defines company-wide technical vision', reach: 'Company-wide influence', tech: ['Makes company-level technical strategy decisions', 'Drives major technology investments', 'Ensures systems scale with business growth'], lead: ['Attracts talent and builds engineering brand', 'Mentors staff-level engineers'], collab: ['Influences executive decisions on technology', 'Represents company in technical communities'], vis: ['Industry-recognized technical leader'] },
  ]

  return levels.map(l => mapToLevelDefinition(matrixId, l.code, l.name, l.order,
    { summary: l.scope, collaborative_reach: l.reach },
    l.tech, l.lead, l.collab, l.vis
  ))
}

function createGenericIntern(matrixId: string): LevelDefinitionInsert[] {
  const levels = [
    {
      code: 'INTERN', name: 'Intern', order: 0,
      scope: 'Completes guided tasks while building foundational engineering skills',
      reach: 'Within team with mentor guidance',
      tech: ['Completes assigned tasks with guidance from mentor', 'Learns codebase structure and development workflow', 'Writes basic tests for own code', 'Practices using version control and CI/CD'],
      lead: ['Asks good questions that demonstrate learning velocity', 'Seeks feedback actively from mentor and team', 'Takes initiative on small improvements'],
      collab: ['Participates in standups and team meetings', 'Communicates blockers early to mentor', 'Documents learnings for future interns'],
      vis: ['Presents intern project to team', 'Positions for return offer through demonstrated growth'],
    },
    {
      code: 'NEW_GRAD', name: 'New Grad / Junior Engineer', order: 1,
      scope: 'Delivers small features independently; transitioning from learning to contributing',
      reach: 'Within team, beginning cross-team awareness',
      tech: ['Ships features with decreasing guidance', 'Participates meaningfully in code reviews', 'Debugs issues in familiar parts of the codebase', 'Understands system architecture at a high level'],
      lead: ['Onboards newer team members or interns', 'Takes ownership of small project areas', 'Provides thoughtful code review feedback'],
      collab: ['Collaborates effectively with team members', 'Asks clarifying questions to ensure alignment', 'Shares knowledge gained during onboarding'],
      vis: ['Builds reputation as reliable contributor', 'Identifies areas for growth and seeks mentorship'],
    },
  ]

  return levels.map(l => mapToLevelDefinition(matrixId, l.code, l.name, l.order,
    { summary: l.scope, collaborative_reach: l.reach },
    l.tech, l.lead, l.collab, l.vis
  ))
}

// ---------- Seed orchestrator ----------

interface MatrixConfig {
  companyName: string
  source: 'public' | 'template'
  sourceUrl: string | null
  isVerified: boolean
  buildLevels: (matrixId: string) => LevelDefinitionInsert[]
}

async function seedMatrix(config: MatrixConfig) {
  // Idempotent check
  const { data: existing } = await supabase
    .from('career_matrices')
    .select('id')
    .eq('company_name', config.companyName)
    .limit(1)

  if (existing && existing.length > 0) {
    console.log(`Skipping ${config.companyName} — already exists`)
    return
  }

  // Insert matrix
  const { data: matrix, error: matrixError } = await supabase
    .from('career_matrices')
    .insert({
      company_name: config.companyName,
      source: config.source,
      source_url: config.sourceUrl,
      is_verified: config.isVerified,
    })
    .select('id')
    .single()

  if (matrixError || !matrix) {
    console.error(`Failed to create matrix for ${config.companyName}:`, matrixError)
    return
  }

  const levels = config.buildLevels(matrix.id)

  const { error: levelsError } = await supabase
    .from('level_definitions')
    .insert(levels)

  if (levelsError) {
    console.error(`Failed to insert levels for ${config.companyName}:`, levelsError)
    // Rollback: remove orphaned matrix row so re-run can retry
    await supabase.from('career_matrices').delete().eq('id', matrix.id)
    return
  }

  console.log(`Seeding ${config.companyName}... ${levels.length} levels inserted`)
}

async function main() {
  // Load research data
  const researchPath = resolve(__dirname, '../docs/career-ladder-research.json')
  const research = JSON.parse(readFileSync(researchPath, 'utf-8'))

  const dropboxData = research.companies.dropbox
  const etsyData = research.companies.etsy

  const matrices: MatrixConfig[] = [
    {
      companyName: 'Dropbox',
      source: 'public',
      sourceUrl: dropboxData.source_url,
      isVerified: true,
      buildLevels: (id) => parseDropboxLevels(id, dropboxData.levels),
    },
    {
      companyName: 'Etsy',
      source: 'public',
      sourceUrl: etsyData.source_url,
      isVerified: true,
      buildLevels: (id) => parseEtsyLevels(id, etsyData.levels),
    },
    {
      companyName: 'Generic FAANG',
      source: 'template',
      sourceUrl: null,
      isVerified: false,
      buildLevels: createGenericFAANG,
    },
    {
      companyName: 'Generic Startup',
      source: 'template',
      sourceUrl: null,
      isVerified: false,
      buildLevels: createGenericStartup,
    },
    {
      companyName: 'Generic Midsize',
      source: 'template',
      sourceUrl: null,
      isVerified: false,
      buildLevels: createGenericMidsize,
    },
    {
      companyName: 'Generic Intern',
      source: 'template',
      sourceUrl: null,
      isVerified: false,
      buildLevels: createGenericIntern,
    },
  ]

  for (const config of matrices) {
    await seedMatrix(config)
  }

  console.log('Done!')
}

main().catch((err) => {
  console.error('Seed script failed:', err)
  process.exit(1)
})
