import { FaWhatsapp } from "react-icons/fa";

const whatsappUrl =
  "https://wa.me/256781849440?text=Hello%20VitaHub%20UG%2C%20I%20have%20a%20question.";

export function WhatsAppWidget() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with VitaHub UG on WhatsApp"
      className="fixed bottom-6 right-6 z-50 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#128C45] max-[600px]:bottom-4 max-[600px]:right-4 max-[600px]:min-h-12 max-[600px]:px-4"
    >
      <FaWhatsapp className="h-6 w-6" aria-hidden="true" />
      {/* <span>Chat</span> */}
    </a>
  );
}
