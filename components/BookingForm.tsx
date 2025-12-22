// components/BookingForm.tsx
"use client";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { SERVICES, DURATIONS, PRICES } from "@/lib/services.catalog";

type FormState = {
  service: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  company?: string; // 蜜罐
};

type HolidayPackage = {
  id: string;
  name: string;
  tagline: string;
  includes: string[];
  queryParam: string;
};

const HOLIDAY_PACKAGES: HolidayPackage[] = [
  {
    id: "winter-glow",
    name: "Winter Glow",
    tagline: "Complete relaxation experience",
    includes: [
      "60-minute Full Body Massage",
      "30-minute Private Sauna Session",
      "30-minute Hot Tub Relaxation",
    ],
    queryParam: "winter_glow",
  },
  {
    id: "couples-retreat",
    name: "Couples' Holiday Retreat",
    tagline: "Share the wellness together",
    includes: [
      "Private Hot Tub Session for Two",
      "Festive Seasonal Treats",
      "Non-Alcoholic Sparkling Beverages",
    ],
    queryParam: "couples_retreat",
  },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const createInitialFormState = (): FormState => ({
  service: SERVICES[0],
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  notes: "",
  company: "",
});
const createTouchedState = () => ({
  service: false,
  date: false,
  time: false,
  name: false,
  email: false,
  phone: false,
  notes: false,
});
type TouchedState = ReturnType<typeof createTouchedState>;

type BookingFormProps = {
  endpoint?: string;
  initial?: Partial<FormState>;
  onSuccess?: (data: any) => void;
  submitLabel?: string;
  hideHoneypot?: boolean;
  compact?: boolean;
};

export default function BookingForm({
  endpoint = "/api/book",
  initial = {},
  onSuccess,
  submitLabel = "Confirm Appointment",
  hideHoneypot = false,
  compact = false,
}: BookingFormProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    ...createInitialFormState(),
    ...initial,
  });
  const [touched, setTouched] = useState<TouchedState>(createTouchedState());
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Structured metadata state
  const [selectedPackageCode, setSelectedPackageCode] = useState<string | null>(
    null,
  );
  const [selectedOfferCode, setSelectedOfferCode] = useState<string | null>(
    null,
  );
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Summary visibility for mobile
  const [showSummary, setShowSummary] = useState(false);

  // Step navigation
  const [currentStep, setCurrentStep] = useState(1);

  const formErrors = useMemo(
    () => ({
      service: "",
      date: form.date ? "" : "Choose a date for your visit.",
      time: form.time ? "" : "Select a preferred time.",
      name: form.name.trim() ? "" : "Your name is required.",
      email: emailRegex.test(form.email) ? "" : "Enter a valid email address.",
      phone: form.phone.trim().length >= 7 ? "" : "Phone number is required.",
      notes: "",
    }),
    [form],
  );

  const showFieldError = (field: keyof typeof formErrors) =>
    (touched[field] || submitAttempted) && formErrors[field]
      ? formErrors[field]
      : "";

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Handle URL package parameter and localStorage offer
  useEffect(() => {
    // Check for package param in URL
    const packageParam = searchParams?.get("package");
    if (packageParam) {
      const pkg = HOLIDAY_PACKAGES.find((p) => p.queryParam === packageParam);
      if (pkg) {
        setSelectedPackageCode(packageParam);
        toast.success(`${pkg.name} package selected! 🎁`, {
          duration: 4000,
        });
      }
    }

    // Load offer from localStorage
    const loadOffer = () => {
      try {
        const offerCode = localStorage.getItem("christmas_offer_selected");
        setSelectedOfferCode(offerCode);
      } catch (e) {
        // localStorage not available
      }
    };

    loadOffer();

    // Listen for storage changes (cross-tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "christmas_offer_selected") {
        loadOffer();
      }
    };

    // Listen for custom event (same-tab)
    const handleOfferChanged = () => {
      loadOffer();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("offer:changed", handleOfferChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("offer:changed", handleOfferChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    setLoading(true);
    setOk(null);
    setErr(null);
    const hasErrors = Object.values(formErrors).some(Boolean);
    if (hasErrors) {
      setLoading(false);
      setErr("Please fix the highlighted fields.");
      return;
    }
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          offer_code: selectedOfferCode || undefined,
          package_code: selectedPackageCode || undefined,
          addons: selectedAddons.length > 0 ? selectedAddons : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Map error codes to user-friendly messages
        const errorCode = data.error || "Failed";
        throw new Error(errorCode);
      }

      if (onSuccess) {
        onSuccess(data);
      } else {
        setOk(
          "Thank you! Your request has been received. We'll confirm by email shortly.",
        );
      }

      setForm(createInitialFormState());
      setTouched(createTouchedState());
      setSubmitAttempted(false);
      setSelectedPackageCode(null);
      setSelectedOfferCode(null);
      setSelectedAddons([]);
      setCurrentStep(1);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const gapClass = compact ? "gap-3" : "gap-4";
  const isMassageService =
    form.service.toLowerCase().includes("massage") ||
    form.service.toLowerCase().includes("spa");

  // Computed values for summary
  const selectedPackage = HOLIDAY_PACKAGES.find(
    (p) => p.queryParam === selectedPackageCode,
  );
  const hasDateTime = !!(form.date && form.time);
  const hasCustomerInfo = !!(form.name && form.email && form.phone);

  // Step indicators
  const steps = [
    { label: "Service", completed: !!form.service },
    { label: "Date & Time", completed: hasDateTime },
    { label: "Details", completed: hasCustomerInfo },
    { label: "Review", completed: false },
  ];

  // Step validation
  const canProceedFromStep = (step: number): boolean => {
    if (step === 1) return !!form.service;
    if (step === 2) return hasDateTime;
    if (step === 3) return hasCustomerInfo;
    return false;
  };

  const handleNext = () => {
    if (currentStep < 4 && canProceedFromStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Step Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    index + 1 === currentStep
                      ? "bg-blue-600 text-white ring-4 ring-blue-200"
                      : step.completed
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-medium whitespace-nowrap ${
                    index + 1 === currentStep
                      ? "text-blue-600"
                      : "text-zinc-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    step.completed ? "bg-emerald-600" : "bg-zinc-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        {/* Left Column: Form */}
        <form
          onSubmit={submit}
          className={`grid ${gapClass}`}
          noValidate
          aria-live="polite"
        >
          {/* 蜜罐（隐藏） */}
          {!hideHoneypot && (
            <div style={{ display: "none" }} aria-hidden="true">
              <label htmlFor="booking-company">Company</label>
              <input
                id="booking-company"
                type="text"
                value={form.company || ""}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
          )}

          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                Choose Your Service
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SERVICES.map((service) => {
                  const isSelected = form.service === service;
                  const duration = DURATIONS[service];
                  const price = PRICES[service];

                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => {
                        handleFieldChange("service", service);
                        markTouched("service");
                      }}
                      className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                          : "border-zinc-200 bg-white hover:border-emerald-300"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-emerald-600 rounded-full p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="pr-8">
                        <h4 className="font-semibold text-sm text-zinc-900 mb-1">
                          {service}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-600">
                          <span>{duration} min</span>
                          <span>•</span>
                          <span className="font-medium text-zinc-900">
                            {price > 0 ? `CA$${price}` : "Custom pricing"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {currentStep === 2 && (
            <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" htmlFor="booking-date">
                Date
              </label>
              <input
                id="booking-date"
                type="date"
                value={form.date}
                lang="en-CA"
                placeholder="YYYY-MM-DD"
                onChange={(e) => handleFieldChange("date", e.target.value)}
                onBlur={() => markTouched("date")}
                required
                className="w-full rounded-md border px-3 py-2"
                aria-invalid={Boolean(showFieldError("date"))}
                aria-describedby={
                  showFieldError("date") ? "booking-date-error" : undefined
                }
              />
              {showFieldError("date") && (
                <p
                  id="booking-date-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {showFieldError("date")}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="booking-time">
                Time
              </label>
              <input
                id="booking-time"
                type="time"
                value={form.time}
                onChange={(e) => handleFieldChange("time", e.target.value)}
                onBlur={() => markTouched("time")}
                required
                className="w-full rounded-md border px-3 py-2"
                aria-invalid={Boolean(showFieldError("time"))}
                aria-describedby={
                  showFieldError("time") ? "booking-time-error" : undefined
                }
              />
              {showFieldError("time") && (
                <p
                  id="booking-time-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {showFieldError("time")}
                </p>
              )}
            </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" htmlFor="booking-name">
                Your Name
              </label>
              <input
                id="booking-name"
                value={form.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                onBlur={() => markTouched("name")}
                required
                className="w-full rounded-md border px-3 py-2"
                autoComplete="name"
                aria-invalid={Boolean(showFieldError("name"))}
                aria-describedby={
                  showFieldError("name") ? "booking-name-error" : undefined
                }
              />
              {showFieldError("name") && (
                <p
                  id="booking-name-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {showFieldError("name")}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="booking-email">
                Email
              </label>
              <input
                id="booking-email"
                type="email"
                value={form.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                onBlur={() => markTouched("email")}
                required
                className="w-full rounded-md border px-3 py-2"
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(showFieldError("email"))}
                aria-describedby={
                  showFieldError("email") ? "booking-email-error" : undefined
                }
              />
              {showFieldError("email") && (
                <p
                  id="booking-email-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {showFieldError("email")}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="booking-phone">
              Phone
            </label>
            <input
              id="booking-phone"
              value={form.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              onBlur={() => markTouched("phone")}
              required
              className="w-full rounded-md border px-3 py-2"
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={Boolean(showFieldError("phone"))}
              aria-describedby={
                showFieldError("phone") ? "booking-phone-error" : undefined
              }
            />
            {showFieldError("phone") && (
              <p id="booking-phone-error" className="mt-1 text-sm text-red-600">
                {showFieldError("phone")}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="booking-notes">
              Notes (optional)
            </label>
            <textarea
              id="booking-notes"
              rows={3}
              value={form.notes || ""}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              onBlur={() => markTouched("notes")}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          {/* Holiday Packages Section */}
          <div className="border-t border-zinc-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                Holiday Packages
              </h3>
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                Limited time
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {HOLIDAY_PACKAGES.map((pkg) => {
                const isSelected = selectedPackageCode === pkg.queryParam;
                return (
                  <div
                    key={pkg.id}
                    className={`rounded-lg border-2 p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                        : isMassageService
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-zinc-200 bg-white hover:border-emerald-400"
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedPackageCode(null);
                        toast.success("Package removed");
                      } else {
                        setSelectedPackageCode(pkg.queryParam);
                        toast.success(`${pkg.name} selected! 🎁`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-sm text-zinc-900">
                        {pkg.name}
                      </h4>
                      {isSelected && (
                        <span className="text-emerald-600 text-sm">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 mb-2">{pkg.tagline}</p>
                    <ul className="space-y-1">
                      {pkg.includes.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-1.5 text-xs text-zinc-700"
                        >
                          <span className="text-emerald-600 mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              * Alcoholic beverages are available upon request, but are not included in the packages.
            </p>
          </div>

          {/* Add-ons Section */}
          <div className="border-t border-zinc-200 pt-4">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">
              Optional Add-ons
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-zinc-200 hover:border-emerald-400 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAddons.includes("sauna")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAddons([...selectedAddons, "sauna"]);
                    } else {
                      setSelectedAddons(
                        selectedAddons.filter((a) => a !== "sauna"),
                      );
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">
                      Sauna Session
                    </span>
                    {isMassageService && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        FREE with massage
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600">
                    Add a relaxing sauna session
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-zinc-200 hover:border-emerald-400 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAddons.includes("hot_tub")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAddons([...selectedAddons, "hot_tub"]);
                    } else {
                      setSelectedAddons(
                        selectedAddons.filter((a) => a !== "hot_tub"),
                      );
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">
                      Hot Tub Session
                    </span>
                    {isMassageService && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        FREE with massage
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600">
                    Add a soothing hot tub session
                  </p>
                </div>
              </label>
            </div>
            {isMassageService && (
              <p className="text-xs text-zinc-500 mt-3">
                Comparable spas often charge extra (e.g., ~CA$35 / 30 min) — included for free with any massage booking.
              </p>
            )}
          </div>

          {/* Offer Summary */}
          {selectedOfferCode && (
            <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900">
                    🎁 Offer Applied: {selectedOfferCode}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    This offer will be included with your booking
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOfferCode(null);
                    try {
                      localStorage.removeItem("christmas_offer_selected");
                    } catch (e) {}
                    toast.success("Offer removed");
                  }}
                  className="text-purple-600 hover:text-purple-800 text-sm ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
            </>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border-2 border-zinc-200 p-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                  Review Your Booking
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-zinc-700">Service:</span>{" "}
                    <span className="text-zinc-900">{form.service}</span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-700">Date & Time:</span>{" "}
                    <span className="text-zinc-900">
                      {new Date(form.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at {form.time}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-700">Name:</span>{" "}
                    <span className="text-zinc-900">{form.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-700">Email:</span>{" "}
                    <span className="text-zinc-900">{form.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-700">Phone:</span>{" "}
                    <span className="text-zinc-900">{form.phone}</span>
                  </div>
                  {form.notes && (
                    <div>
                      <span className="font-medium text-zinc-700">Notes:</span>{" "}
                      <span className="text-zinc-900">{form.notes}</span>
                    </div>
                  )}
                  {selectedPackage && (
                    <div>
                      <span className="font-medium text-zinc-700">Package:</span>{" "}
                      <span className="text-blue-900 font-medium">📦 {selectedPackage.name}</span>
                    </div>
                  )}
                  {selectedAddons.length > 0 && (
                    <div>
                      <span className="font-medium text-zinc-700">Add-ons:</span>{" "}
                      <span className="text-emerald-900">{selectedAddons.map(a => `➕ ${a}`).join(", ")}</span>
                    </div>
                  )}
                  {selectedOfferCode && (
                    <div>
                      <span className="font-medium text-zinc-700">Offer:</span>{" "}
                      <span className="text-purple-900 font-medium">🎁 {selectedOfferCode}</span>
                    </div>
                  )}
                </div>
              </div>

              <button className="btn btn-primary w-full" disabled={loading}>
                {loading ? "Submitting..." : submitLabel}
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 rounded-lg font-medium transition"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceedFromStep(currentStep)}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
              >
                Next
              </button>
            </div>
          )}

          {/* Success Card */}
          {ok && (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900">
                    Success!
                  </h3>
                  <p className="mt-1 text-sm text-green-700">{ok}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Card */}
          {err && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900">
                    {err === "time_taken"
                      ? "Time Slot Unavailable"
                      : "Booking Error"}
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    {err === "time_taken"
                      ? "Someone just booked this time. Please choose another slot."
                      : err}
                  </p>
                  <button
                    onClick={() => setErr(null)}
                    className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                  >
                    Choose Another Time
                  </button>
                </div>
              </div>
            </div>
          )}

          <small>
            By booking, you acknowledge these are wellness sessions, not medical
            treatment.
          </small>
        </form>

        {/* Right Column: Summary Sidebar (Desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-zinc-200 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                Booking Summary
              </h3>

              <div className="space-y-4">
                {/* Service */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Service
                  </label>
                  <p className="text-sm text-zinc-900 mt-1">
                    {form.service || "Not selected"}
                  </p>
                </div>

                {/* Date & Time */}
                {hasDateTime && (
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Date & Time
                    </label>
                    <p className="text-sm text-zinc-900 mt-1">
                      {new Date(form.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at {form.time}
                    </p>
                  </div>
                )}

                {/* Package */}
                {selectedPackage && (
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Holiday Package
                    </label>
                    <div className="mt-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        📦 {selectedPackage.name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Add-ons */}
                {selectedAddons.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Add-ons
                    </label>
                    <div className="mt-1 space-y-1">
                      {selectedAddons.map((addon) => (
                        <div
                          key={addon}
                          className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg"
                        >
                          <p className="text-sm text-emerald-900">➕ {addon}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offer */}
                {selectedOfferCode && (
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Special Offer
                    </label>
                    <div className="mt-1 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">
                        🎁 {selectedOfferCode}
                      </p>
                    </div>
                  </div>
                )}

                {/* Customer Info */}
                {hasCustomerInfo && (
                  <div className="pt-4 border-t">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Contact
                    </label>
                    <div className="mt-1 text-sm text-zinc-900 space-y-1">
                      <p>{form.name}</p>
                      <p className="text-zinc-600">{form.email}</p>
                      <p className="text-zinc-600">{form.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Summary (Collapsible) */}
      <div className="lg:hidden mt-6">
        <button
          type="button"
          onClick={() => setShowSummary(!showSummary)}
          className="w-full px-4 py-3 bg-white rounded-2xl shadow border-2 border-zinc-200 flex items-center justify-between"
        >
          <span className="text-sm font-semibold text-zinc-900">
            View Booking Summary
          </span>
          <svg
            className={`w-5 h-5 text-zinc-600 transition-transform ${
              showSummary ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showSummary && (
          <div className="mt-3 bg-white rounded-2xl shadow border-2 border-zinc-200 p-4">
            <h3 className="text-base font-semibold text-zinc-900 mb-3">
              Booking Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase">
                  Service
                </label>
                <p className="text-zinc-900 mt-1">{form.service}</p>
              </div>

              {hasDateTime && (
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase">
                    Date & Time
                  </label>
                  <p className="text-zinc-900 mt-1">
                    {new Date(form.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at {form.time}
                  </p>
                </div>
              )}

              {selectedPackage && (
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase">
                    Package
                  </label>
                  <p className="text-sm font-medium text-blue-900 mt-1">
                    📦 {selectedPackage.name}
                  </p>
                </div>
              )}

              {selectedAddons.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase">
                    Add-ons
                  </label>
                  <div className="mt-1 space-y-1">
                    {selectedAddons.map((addon) => (
                      <p key={addon} className="text-emerald-900">
                        ➕ {addon}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {selectedOfferCode && (
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase">
                    Offer
                  </label>
                  <p className="text-sm font-medium text-purple-900 mt-1">
                    🎁 {selectedOfferCode}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
