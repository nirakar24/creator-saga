// Creator Saga site configuration. Every value here is public (it ships to the browser) — never put secrets in this file.
// Empty strings mean "not configured"; the site falls back gracefully instead of showing dead links.
window.CS_CONFIG = {
  // Calendly event link for the 30-minute Content Strategy Call, e.g. "https://calendly.com/creatorsaga/content-strategy-call".
  // When set, the scheduler is embedded on /contact/ and /content-production/ and completed bookings are tracked.
  calendlyUrl: "",

  // Used while calendlyUrl is empty: the booking form the previous site already linked to.
  fallbackBookingUrl: "https://p5pconshkqz.typeform.com/to/eH513t4p",

  // Endpoint for the secondary inquiry form on /contact/. Set to "/contact.php" once INQUIRY_TO is configured in that file.
  // Left empty, the inquiry form stays hidden and visitors are pointed to booking instead.
  inquiryEndpoint: "",

  // Analytics. Nothing loads until an ID is set AND the visitor accepts the cookie notice.
  ga4Id: "",        // "G-XXXXXXXXXX"
  metaPixelId: "381200110882083",  // numeric Pixel ID

  // Founder-led VSL for /content-production/. The section stays hidden until src is set.
  vsl: {
    src: "/media/vid2.mp4",        // MP4 URL (CDN recommended)
    poster: "/media/32_Why%20openings%20arent%20your%20problem_01.png",     // poster image URL
    captions: ""    // WebVTT captions URL (strongly recommended)
  }
};
