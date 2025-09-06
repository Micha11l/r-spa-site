import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";

export default function PoliciesPage(){
  return (
    <section className="section">
      <Container>
        <SectionTitle title="Policies & Disclaimer" />
        <div className="prose max-w-3xl">
          <h4>Disclaimer</h4>
          <p>Our services (including Seqex and Plasma light sessions) are wellness therapies and not medical treatments. They are not intended to diagnose, treat, cure, or prevent any disease. Information on this website is for educational purposes only and not a substitute for professional medical advice. Always consult your healthcare provider for medical concerns. Results vary.</p>

          <h4>Cancellation</h4>
          <p>We kindly ask for 24 hours notice to reschedule or cancel. Late cancellations/no-shows may incur a fee or forfeit deposits.</p>

          <h4>Privacy</h4>
          <p>Your information is used solely to manage appointments and communication. We never sell personal data.</p>
        </div>
      </Container>
    </section>
  )
}
