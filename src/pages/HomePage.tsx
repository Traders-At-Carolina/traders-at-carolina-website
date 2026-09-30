import { PageMeta } from '../components/ui'
import { HomeHero } from '../home/HomeHero'
import { HomeAbout } from '../home/HomeAbout'
import { HomeSlider } from '../home/HomeSlider'
import { HomePlacement } from '../home/HomePlacement'
import { HomeRecruitment } from '../home/HomeRecruitment'

/**
 * Homepage sections, in spec order. The nav (1) and footer (7) live in
 * SiteLayout because they are shared by every route.
 */
export function HomePage() {
  return (
    <>
      <PageMeta
        title="Quantitative Finance at UNC"
        description="UNC Chapel Hill's undergraduate quantitative finance club."
      />
      <HomeHero />
      <HomeAbout />
      <HomeSlider />
      <HomePlacement />
      <HomeRecruitment />
    </>
  )
}
