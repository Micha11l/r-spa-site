import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import BookingForm from "@/components/BookingForm";

export default function BookingPage(){
  return (
    <section className="section">
      <Container>
        <SectionTitle title="Book an Appointment" subtitle="No account required. Choose a service, date & time." />
        <BookingForm />
        <div className="mt-8 text-sm text-ash">
          Exact address provided upon confirmation. Please review our <a href="/policies">Policies</a>.
        </div>
      </Container>
    </section>
  )
}
