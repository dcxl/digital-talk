import { PageFrame } from "../components/page-frame";
import { AboutDetails } from "../about/about-details";

export function AboutPage() {
  return (
    <PageFrame eyebrow="About" title="关于项目">
      <AboutDetails />
    </PageFrame>
  );
}
