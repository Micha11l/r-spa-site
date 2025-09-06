import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";

export default function ServicesPage(){
  return (
    <section className="section">
      <Container>
        <SectionTitle title="Services & Pricing" subtitle="Transparent, minimalist pricing for wellness sessions." />
        <div id="seqex" className="mt-8">
          <h3 className="h3">Seqex & Plasma Lights</h3>
          <div className="mt-3 grid md:grid-cols-2 gap-6">
            <div className="card">
              <div className="font-semibold">Seqex</div>
              <ul className="mt-2 space-y-1">
                <li>Individual Session – $60</li>
                <li>10 Session Package – $500</li>
                <li>Personalize Electroceutical Test – $200</li>
                <li>Seqex + Plasma Lights – $75</li>
                <li>RX6 Full Body Session (40 mins) – $200</li>
                <li>RX6 Full Body 5 Pack – $900</li>
                <li>RX1 Seat Session (10 mins x 2) – $30</li>
                <li>RX1 Seat 10 Pack – $250</li>
                <li>RX1 Seat 20 Pack – $400</li>
              </ul>
            </div>
            <div className="card">
              <div className="font-semibold">Plasma RX1 & RX2 Lights</div>
              <ul className="mt-2 space-y-1">
                <li>(20 minutes) Individual Session – $50</li>
                <li>5 Pack – $225</li>
                <li>10 Pack – $400</li>
              </ul>
              <div className="font-semibold mt-6">Solarc Vitamin D UVB</div>
              <ul className="mt-2 space-y-1">
                <li>(4 minutes) Individual Session – $25</li>
                <li>10 Session Package – $200</li>
              </ul>
              <div className="font-semibold mt-6">Vibration Machine + Thigh Scanner Plasma Light</div>
              <ul className="mt-2 space-y-1">
                <li>(10–20 minutes) Individual Session – $40</li>
                <li>10 Pack – $350</li>
              </ul>
            </div>
          </div>
        </div>

        <div id="alt" className="mt-12">
          <h3 className="h3">Alternative Services</h3>
          <div className="grid md:grid-cols-2 gap-6 mt-3">
            <div className="card">
              <div className="font-semibold">Life Force</div>
              <div>Treatment – $125</div>
            </div>
            <div className="card">
              <div className="font-semibold">Ondamed</div>
              <div>Assessment and Treatment – $150</div>
              <div>Preset Program – $60</div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <a className="btn btn-primary" href="/booking">Book Now</a>
        </div>
        <p className="text-xs text-ash mt-6">Not a medical service. For wellness purposes only.</p>
      </Container>
    </section>
  )
}
