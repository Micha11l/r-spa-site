import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";

export default function FAQPage(){
  return (
    <section className="section">
      <Container>
        <SectionTitle title="Frequently Asked Questions" />
        <div className="space-y-6 max-w-3xl">
          <div>
            <div className="font-semibold">Are these medical treatments?</div>
            <p className="text-ash">No. Our services are non-medical wellness sessions intended for relaxation and general wellbeing.</p>
          </div>
          <div>
            <div className="font-semibold">What should I wear?</div>
            <p className="text-ash">Comfortable clothing. Some light sessions may require exposing an area for targeted light.</p>
          </div>
          <div>
            <div className="font-semibold">Any contraindications?</div>
            <p className="text-ash">Seqex PEMF is not recommended for those with pacemakers or electronic implants. If pregnant or with serious conditions, please consult your physician before booking.</p>
          </div>
          <div>
            <div className="font-semibold">Where are you located?</div>
            <p className="text-ash">Private studio north of HW404, Toronto. Exact address is shared after booking confirmation.</p>
          </div>
        </div>
      </Container>
    </section>
  )
}
