
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../lib/api";
import { formatPrice } from "../lib/currency";
import {
  getProductVariantSlug,
  getProductVariants,
  getStartingVariant,
  getVariantImages,
  type ProductVariant,
} from "../lib/products";
import { useCart } from "./cart-context";
import { useCatalog } from "./catalog-context";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: { productId: string; variantId: string }[];
};

type AssistantReply = {
  message: string;
  recommendations: { productId: string; variantId: string }[];
};

const initialMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! 👋 Welcome to VitaHub UG. I'm here to help you find the right vitamins, supplements, and wellness products. What are you looking for today?",
};

const starterPrompts = [
  "Help me choose a multivitamin",
  "Show me affordable vitamins under UGX 50,000",
  "What protein supplements do you have?",
  "Compare your Vitamin C options",
  "Which supplements are best for general wellness?",
  "What are your cheapest supplements?",
];

export function ShoppingAssistant() {
  const { products, ready: catalogReady } = useCatalog();
  const { addToCart } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [addedVariant, setAddedVariant] = useState("");
  const [failedMessageId, setFailedMessageId] = useState<string | null>(null);

  const messageListRef = useRef<HTMLDivElement>(null);
  const messageSequence = useRef(0);

  function createMessageId(role: ChatMessage["role"]) {
    messageSequence.current += 1;
    return `message-${messageSequence.current}-${role}`;
  }

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;

    const latestMessage = messages[messages.length - 1];

    if (!isSending && latestMessage?.role === "assistant") {
      const response = messageList.querySelector<HTMLElement>(
        `[data-message-id="${latestMessage.id}"]`,
      );

      if (response) {
        const offset =
          response.getBoundingClientRect().top -
          messageList.getBoundingClientRect().top;

        messageList.scrollTo({
          top: messageList.scrollTop + offset - 8,
          behavior: "smooth",
        });
        return;
      }
    }

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  async function sendMessage(content: string, retryMessageId?: string) {
    const question = content.trim();
    if (!question || isSending) return;

    const retryMessage = retryMessageId
      ? messages.find(
          (message) => message.id === retryMessageId && message.role === "user",
        )
      : undefined;

    if (retryMessageId && !retryMessage) return;

    const userMessage = retryMessage ?? {
      id: createMessageId("user"),
      role: "user" as const,
      content: question,
    };

    const nextMessages = retryMessage ? messages : [...messages, userMessage];

    setMessages(nextMessages);
    if (!retryMessage) setInput("");
    setError("");
    setFailedMessageId(null);
    setIsSending(true);

    try {
      const conversation = nextMessages
        .filter((message) => message.id !== "welcome")
        .map(({ role, content: messageContent }) => ({
          role,
          content: messageContent,
        }))
        .slice(-12);

      const reply = await apiRequest<AssistantReply>("/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ messages: conversation }),
      });

      setMessages([
        ...nextMessages,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: reply.message,
          recommendations: reply.recommendations,
        },
      ]);

      setFailedMessageId(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The shopping assistant could not respond. Please try again.",
      );

      setFailedMessageId(userMessage.id);
    } finally {
      setIsSending(false);
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function addRecommendedProduct(productId: string, variant: ProductVariant) {
    const product = products.find((candidate) => candidate.id === productId);

    if (!product) {
      setError("This product is no longer available in the catalogue.");
      return;
    }

    try {
      addToCart(product, 1, variant.id);
      setAddedVariant(`${product.id}:${variant.id}`);
      setError("");
    } catch (cartError) {
      setError(
        cartError instanceof Error
          ? cartError.message
          : "This product could not be added to your bag.",
      );
    }
  }

  return (
    <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 z-[100] max-[600px]:bottom-0 max-[600px]:right-0">

      {isOpen ? (
        <section
          aria-label="VitaHub shopping assistant"
          aria-modal="true"
          role="dialog"
          className="
            flex h-[min(43rem,calc(100dvh-3rem))]
            w-[min(25rem,calc(100vw-3rem))]
            flex-col overflow-hidden rounded-[1.5rem]
            border border-[#E9E1F5] bg-white
            shadow-[0_24px_80px_rgba(46,16,101,0.20)]
            animate-in fade-in slide-in-from-bottom-3 duration-200

            max-[600px]:h-[100dvh]
            max-[600px]:h-[100svh]
            max-[600px]:w-screen
            max-[600px]:max-w-none
            max-[600px]:rounded-none
            max-[600px]:border-0
            max-[600px]:shadow-none
          "
        >
          {/* Header */}
          <header className="relative flex shrink-0 items-center justify-between gap-3 overflow-hidden bg-[#2E1065] px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] text-white max-[600px]:px-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/5"
            />

            <div className="relative flex min-w-0 items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white max-[600px]:h-10 max-[600px]:w-10">
                <Image
                  src="/logo.png"
                  height={44}
                  width={44}
                  className="h-full w-full object-contain p-1"
                  alt="VitaHub UG"
                />
              </div>

              <div className="min-w-0">
                <h2 className="m-0 truncate text-[15px] font-semibold tracking-tight">
                  VitaHub Assistant
                </h2>

                <p className="m-0 mt-1 flex items-center gap-1.5 text-[11px] text-white/75">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#62D84E]" />
                  Here to help you shop well
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close shopping assistant"
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              ×
            </button>
          </header>

          {/* Conversation */}
          <div
            ref={messageListRef}
            className="
              min-h-0 flex-1 space-y-5 overflow-y-auto
              overscroll-contain bg-[#FAF9FC] p-4
              max-[600px]:p-3
            "
            aria-live="polite"
            aria-relevant="additions text"
            role="log"
            aria-label="Conversation"
          >
            <div className="flex items-center justify-center">
              <span className="rounded-full bg-[#F0EAF9] px-3 py-1 text-[10px] font-medium text-[#75658E]">
                Your VitaHub shopping assistant
              </span>
            </div>

            {messages.map((message) => (
              <div
                data-message-id={message.id}
                className={`flex min-w-0 flex-col ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
                key={message.id}
              >
                {message.role === "assistant" && (
                  <span className="mb-1.5 ml-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#88799D]">
                    VitaHub Assistant
                  </span>
                )}

                <p
                  className={`m-0 max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[13px] leading-[1.65] max-[600px]:max-w-[94%] ${
                    message.role === "user"
                      ? "rounded-br-md bg-[#6D28D9] text-white shadow-sm"
                      : "rounded-bl-md border border-[#EAE4F1] bg-white text-[#342B40] shadow-[0_2px_8px_rgba(46,16,101,0.035)]"
                  }`}
                >
                  {message.content}
                </p>

                {message.id === failedMessageId && (
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => void sendMessage(message.content, message.id)}
                    className="mt-2 rounded-full px-3 py-2 text-xs font-semibold text-[#6D28D9] hover:bg-[#F0EAF9] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]"
                  >
                    {isSending ? "Retrying…" : "↻ Try again"}
                  </button>
                )}

                {/* Product recommendations */}
                {message.recommendations && (
                  <div className="mt-3 grid w-full min-w-0 gap-3">
                    {message.recommendations.map((recommendation) => {
                      const product = products.find(
                        ({ id }) => id === recommendation.productId,
                      );

                      const variant = product
                        ? getProductVariants(product).find(
                            ({ id }) => id === recommendation.variantId,
                          ) ?? getStartingVariant(product)
                        : undefined;

                      if (!product || !variant) return null;

                      const image = getVariantImages(product, variant)[0]?.url;

                      const detailHref = `/products/${product.id}?variant=${encodeURIComponent(
                        getProductVariantSlug(
                          variant,
                          getProductVariants(product),
                        ),
                      )}`;

                      const optionKey = `${product.id}:${variant.id}`;

                      return (
                        <article
                          className="w-full min-w-0 overflow-hidden rounded-2xl border border-[#E9E1F5] bg-white shadow-[0_3px_12px_rgba(46,16,101,0.04)]"
                          key={optionKey}
                        >
                          <Link
                            href={detailHref}
                            className="flex min-w-0 gap-3 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6D28D9]"
                          >
                            <span className="relative h-[84px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-[#F3E8FF] max-[380px]:h-[72px] max-[380px]:w-[64px]">
                              {image ? (
                                <Image
                                  src={image}
                                  alt={variant.alt ?? product.name}
                                  fill
                                  sizes="76px"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center text-2xl text-[#6D28D9]">
                                  ✳
                                </span>
                              )}
                            </span>

                            <span className="min-w-0 flex-1 py-0.5">
                              <span className="block line-clamp-2 text-[13px] font-semibold leading-5 text-[#2E1065]">
                                {product.name}
                              </span>

                              <span className="mt-1 block truncate text-[11px] text-[#82768F]">
                                {[
                                  variant.form,
                                  variant.potency,
                                  variant.packageQuantity,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>

                              <span className="mt-2 block text-[14px] font-bold text-[#4C1D95]">
                                {formatPrice(variant.price)}
                              </span>
                            </span>
                          </Link>

                          {variant.ingredients && (
                            <p className="m-0 px-3 pb-3 text-[11px] leading-4 text-[#756B82] line-clamp-2">
                              Ingredients: {variant.ingredients}
                            </p>
                          )}

                          <div className="border-t border-[#F0EAF5] p-3">
                            <button
                              type="button"
                              disabled={!catalogReady}
                              onClick={() =>
                                addRecommendedProduct(product.id, variant)
                              }
                              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#20A800] px-4 text-xs font-semibold text-white transition-all hover:bg-[#188C00] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20A800]"
                            >
                              {addedVariant === optionKey ? (
                                <>
                                  <span aria-hidden="true">✓</span>
                                  Added to your bag
                                </>
                              ) : (
                                <>
                                  <span aria-hidden="true">+</span>
                                  Add to bag
                                </>
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Starter prompts */}
            {messages.length === 1 && (
              <div className="pt-1">
                <p className="mb-2 ml-1 text-[11px] font-semibold text-[#75658E]">
                  You can ask me about
                </p>

                <div className="flex flex-wrap gap-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      className="max-w-full rounded-xl border border-[#E5D9F2] bg-white px-3 py-2.5 text-left text-[11px] font-medium leading-4 text-[#59368A] transition-all hover:border-[#C4A8E5] hover:bg-[#F3E8FF] hover:text-[#4C1D95] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]"
                      key={prompt}
                      onClick={() => void sendMessage(prompt)}
                      type="button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSending && (
              <div className="flex items-start gap-2">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F0EAF9] text-xs text-[#6D28D9]">
                  ✳
                </span>

                <p
                  className="m-0 rounded-2xl rounded-bl-md border border-[#EAE4F1] bg-white px-4 py-3 text-xs text-[#756B82]"
                  role="status"
                >
                  Finding the right products…
                </p>
              </div>
            )}
          </div>

          {/* Error and loading notice */}
          {(error || !catalogReady) && (
            <p
              className="m-0 shrink-0 border-t border-[#F0D8D5] bg-[#FFF7F5] px-4 py-2.5 text-xs leading-5 text-[#8F3E35]"
              role="alert"
            >
              {error || "Loading the store catalogue…"}
            </p>
          )}

          {/* Message input */}
          <form
            className="
              shrink-0 border-t border-[#EAE4F1] bg-white
              p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]
              max-[600px]:p-3
              max-[600px]:pb-[max(0.75rem,env(safe-area-inset-bottom))]
            "
            onSubmit={submitMessage}
          >
            <div className="flex items-end gap-2 rounded-2xl border border-[#E9E1F5] bg-[#FAF9FC] p-1.5 transition-colors focus-within:border-[#A78BCE] focus-within:ring-2 focus-within:ring-[#F0EAF9]">
              <label className="sr-only" htmlFor="shopping-assistant-message">
                Ask VitaHub Assistant
              </label>

              <textarea
                id="shopping-assistant-message"
                className="max-h-28 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2.5 py-2.5 text-base text-[#342B40] outline-none placeholder:text-[#A39AAF] md:text-sm"
                maxLength={600}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
                placeholder="Ask about products, ingredients…"
                value={input}
              />

              <button
                type="submit"
                disabled={isSending || !input.trim()}
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6D28D9] text-white transition-all hover:bg-[#4C1D95] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 2 11 13" />
                  <path d="m22 2-7 20-4-9-9-4 20-7Z" />
                </svg>
              </button>
            </div>

            <p className="m-0 pt-2 text-center text-[10px] leading-4 text-[#958BA1]">
              Product details come from our catalogue. For medical advice,
              check with a healthcare professional.
            </p>
          </form>
        </section>
      ) : (
        <button
  type="button"
  aria-label="Open VitaHub shopping assistant"
  aria-expanded={isOpen}
  onClick={() => setIsOpen(true)}
  className="
    group flex min-h-14 items-center gap-3
    rounded-full bg-[#20A800] px-5
    text-sm font-semibold text-white
    shadow-[0_8px_28px_rgba(32,168,0,0.28)]
    transition-all duration-200
    hover:-translate-y-1 hover:bg-[#188C00]
    hover:shadow-[0_12px_32px_rgba(32,168,0,0.35)]
    active:scale-[0.97]
    focus-visible:outline focus-visible:outline-2
    focus-visible:outline-offset-4 focus-visible:outline-[#20A800]
    max-[600px]:h-12
    max-[600px]:min-h-12
    max-[600px]:w-12
    max-[600px]:justify-center
    max-[600px]:rounded-full
    max-[600px]:p-0
    max-[600px]:mb-3
    max-[600px]:mr-3
  "
>
  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
    <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.9L4 21l4.8-1.6A8.5 8.5 0 1 0 12 3.5Z" />
              <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
            </svg>
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-[#20A800] bg-white" />
  </span>

  <span className="hidden text-left md:block">
    <span className="block text-[13px] leading-4">
      Ask VitaHub
    </span>
    <span className="mt-0.5 block text-[10px] font-medium text-white/80">
      Your shopping assistant
    </span>
  </span>
</button>
      )}
    </div>
  );
}
