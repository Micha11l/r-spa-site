import Container from "./Container";
export default function Footer() {
  return (
    <footer className="border-t border-ink/10 py-10 mt-16">
      <Container>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-semibold">R Spa</div>
            <div>Private wellness studio · {process.env.SITE_CITY || "North of HW404, Toronto"}</div>
            <div className="mt-2">Email: {process.env.SITE_PUBLIC_EMAIL || "aaa@example.com"}</div>
            <div>Phone: {process.env.SITE_PUBLIC_PHONE || "123-456-7890"}</div>
          </div>
          <div>
            <div className="font-semibold">Info</div>
            <ul className="space-y-1">
              <li><a href="/services">Services</a></li>
              <li><a href="/booking">Booking</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/policies">Policies & Disclaimer</a></li>
            </ul>
          </div>
          <div className="text-ash">
            Not a medical service. Wellness sessions only. See policies for details.
          </div>
        </div>
        <div className="text-ash text-xs mt-6">© {new Date().getFullYear()} R Spa</div>
      </Container>
    </footer>
  );
}
