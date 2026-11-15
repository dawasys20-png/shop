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
      const conversation = [
        ...nextMessages
          .filter((message) => message.id !== "welcome")
          .map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
      ].slice(-12);
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
    <div className="fixed bottom-24 right-6 z-50 max-[600px]:bottom-20 max-[600px]:right-4">
      {isOpen ? (
        <section
          aria-label="VitaHub shopping assistant"
          aria-modal="false"
          className="flex mt-10 h-[min(42rem,calc(100dvh-8rem))] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.75rem] border border-[#DDEBDD] bg-white shadow-[0_20px_70px_rgba(19,67,35,0.22)]"
          role="dialog"
        >
          <header className="flex items-center justify-between gap-4 bg-[#176B3A] px-5 py-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl" aria-hidden="true">
                ✳
              </span>
              <div className="min-w-0">
                <h2 className="m-0 truncate text-base font-semibold">VitaHub Ug assistant</h2>
                <p className="m-0 mt-0.5 text-xs text-white/80">Here to help you shop well</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close shopping assistant"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-white/90 transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              ×
            </button>
          </header>

          <div
            ref={messageListRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#F7FAF6] p-4"
            aria-live="polite"
            aria-relevant="additions text"
            role="log"
            aria-label="Conversation"
          >
            {messages.map((message) => (
              <div
                data-message-id={message.id}
                className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                key={message.id}
              >
                <p
                  className={`m-0 max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[13px] leading-5 ${
                    message.role === "user"
                      ? "rounded-br-md bg-[#176B3A] text-white"
                      : "rounded-bl-md border border-[#E5EDE4] bg-white text-[#24352A]"
                  }`}
                >
                  {message.content}
                </p>
                {message.id === failedMessageId && (
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => void sendMessage(message.content, message.id)}
                    className="mt-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[#176B3A] underline underline-offset-2 hover:bg-[#EAF4E7] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B3A]"
                  >
                    {isSending ? "Retrying…" : "Try again"}
                  </button>
                )}
                {message.recommendations && (
                  <div className="mt-3 grid w-full gap-3">
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
                        getProductVariantSlug(variant, getProductVariants(product)),
                      )}`;
                      const optionKey = `${product.id}:${variant.id}`;

                      return (
                        <article
                          className="overflow-hidden rounded-2xl border border-[#DFE9DC] bg-white"
                          key={optionKey}
                        >
                          <Link
                            href={detailHref}
                            className="flex gap-3 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#176B3A]"
                          >
                            <span className="relative h-[76px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-[#EFF5EC]">
                              {image ? (
                                <Image
                                  src={image}
                                  alt={variant.alt ?? product.name}
                                  fill
                                  sizes="68px"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center text-xl text-[#176B3A]" aria-hidden="true">✳</span>
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-semibold text-[#23372A]">
                                {product.name}
                              </span>
                              <span className="mt-1 block truncate text-[11px] text-[#627468]">
                                {[variant.form, variant.potency, variant.packageQuantity]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                              <span className="mt-2 block text-sm font-semibold text-[#176B3A]">
                                {formatPrice(variant.price)}
                              </span>
                            </span>
                          </Link>
                          {variant.ingredients && (
                            <p className="m-0 px-3 pb-3 text-[11px] leading-4 text-[#627468] line-clamp-2">
                              Ingredients: {variant.ingredients}
                            </p>
                          )}
                          <div className="border-t border-[#EDF2EA] px-3 py-2.5">
                            <button
                              type="button"
                              disabled={!catalogReady}
                              onClick={() => addRecommendedProduct(product.id, variant)}
                              className="min-h-9 w-full rounded-full bg-[#DDF2D7] px-3 text-xs font-semibold text-[#174D2D] transition-colors hover:bg-[#C9E9C0] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B3A]"
                            >
                              {addedVariant === optionKey ? "Added to your bag" : "Add to bag"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pl-1">
                {starterPrompts.map((prompt) => (
                  <button
                    className="rounded-full border border-[#CFE0CB] bg-white px-3 py-2 text-left text-[11px] font-medium text-[#315B3B] transition-colors hover:bg-[#EAF4E7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B3A]"
                    key={prompt}
                    onClick={() => void sendMessage(prompt)}
                    type="button"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            {isSending && (
              <p className="m-0 w-fit rounded-2xl rounded-bl-md border border-[#E5EDE4] bg-white px-4 py-3 text-xs text-[#627468]" role="status">
                Finding the right products…
              </p>
            )}
            <div aria-hidden="true" />
          </div>

          {(error || !catalogReady) && (
            <p className="m-0 border-t border-[#F0D8D5] bg-[#FFF7F5] px-4 py-2 text-xs leading-5 text-[#8F3E35]" role="alert">
              {error || "Loading the store catalogue…"}
            </p>
          )}

          <form
            className="flex items-end gap-2 border-t border-[#E7EEE5] bg-white p-3"
            onSubmit={submitMessage}
          >
            <label className="sr-only" htmlFor="shopping-assistant-message">
              Ask VitaHub Ug assistant
            </label>
            <textarea
              id="shopping-assistant-message"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-[#DDE7DA] bg-[#FBFCFA] px-3.5 py-3 text-sm text-[#25352A] outline-none placeholder:text-[#89968C] focus:border-[#438653] focus:ring-2 focus:ring-[#DDEED8]"
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#176B3A] text-white transition-colors hover:bg-[#11572E] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B3A]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 2 11 13" />
                <path d="m22 2-7 20-4-9-9-4 20-7Z" />
              </svg>
            </button>
          </form>
          <p className="m-0 bg-white px-4 pb-3 text-[10px] leading-4 text-[#7B897E]">
            Product details come from our catalogue. For medical advice, check with a healthcare professional.
          </p>
        </section>
      ) : (
        <button
          type="button"
          aria-label="Open VitaHub shopping assistant"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className="flex min-h-14 items-center gap-2.5 rounded-full bg-[#176B3A] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(23,107,58,0.3)] transition-transform hover:scale-[1.03] hover:bg-[#11572E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#176B3A] max-[600px]:min-h-12 max-[600px]:px-4"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.9L4 21l4.8-1.6A8.5 8.5 0 1 0 12 3.5Z" />
            <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
          </svg>
          Ask VitaHub Ug
        </button>
      )}
    </div>
  );
}
