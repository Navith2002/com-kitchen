import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, SendHorizontal, Sparkles, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useOverviewData from '../../hooks/useOverviewData';

const ROUTE_GUIDANCE = {
  '/overview': 'You are on Overview. Ask for a cross-domain summary, strongest anomalies, and what to prioritize first.',
  '/gas': 'You are on Gas Monitoring. Ask about leak risk trends, warning spikes, and likely environmental drivers.',
  '/temperature-humidity': 'You are on Temperature & Humidity Monitoring. Ask about comfort/stability drift and factors pushing variance.',
  '/fridge': 'You are on Fridge Monitoring. Ask about door-open behavior patterns, likely causes, and food-safety implications.',
  '/fire': 'You are on Fire Monitoring. Ask about smoke/temperature escalation and what immediate mitigation actions to take.',
};

const DEFAULT_PROMPTS = [
  'What are the top anomalies across all sensors right now?',
  'What influences high gas readings in this dashboard?',
  'Summarize the most important trend changes from recent history.',
];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickNumericKey(record = {}) {
  const candidates = Object.entries(record)
    .filter(([key, value]) => key !== 'timestamp' && key !== 'status' && Number.isFinite(Number(value)))
    .sort((a, b) => Math.abs(Number(b[1])) - Math.abs(Number(a[1])));

  return candidates[0]?.[0] || null;
}

function summarizeDomain(label, domainData) {
  const latest = domainData?.latest || null;
  const history = Array.isArray(domainData?.history) ? domainData.history : [];
  const analysis = domainData?.analysis || null;

  if (!latest && history.length === 0) {
    return { label, unavailable: true };
  }

  const metricKey = pickNumericKey(latest || history[history.length - 1] || {});
  const current = metricKey ? toNumber(latest?.[metricKey]) : null;
  const recentSlice = history.slice(-20);
  const firstValue = metricKey ? toNumber(recentSlice[0]?.[metricKey]) : null;
  const lastValue = metricKey ? toNumber(recentSlice[recentSlice.length - 1]?.[metricKey]) : null;
  const delta = firstValue != null && lastValue != null ? lastValue - firstValue : null;

  const warnings = history.filter((item) => {
    const status = `${item?.status || ''}`.toLowerCase();
    return status && status !== 'normal' && status !== 'safe';
  });

  return {
    label,
    metricKey,
    current,
    delta,
    warningCount: warnings.length,
    latestStatus: latest?.status || null,
    lastTimestamp: latest?.timestamp || history[history.length - 1]?.timestamp || null,
    analysis,
  };
}

function buildContext(overview, pathname) {
  const gas = summarizeDomain('Gas', overview?.gas);
  const temperature = summarizeDomain('Temperature/Humidity', overview?.temp);
  const fridge = summarizeDomain('Fridge', overview?.fridge);
  const fire = summarizeDomain('Fire', overview?.fire);

  return {
    route: pathname,
    guidance: ROUTE_GUIDANCE[pathname] || 'You are on a dashboard route. Use current readings, trends, and anomaly status to guide decisions.',
    domains: { gas, temperature, fridge, fire },
    generatedAt: new Date().toISOString(),
  };
}

function buildLocalFallbackResponse(question, context) {
  const normalizedQuestion = question.toLowerCase();
  const domainEntries = Object.values(context.domains);
  const available = domainEntries.filter((item) => !item.unavailable);

  if (available.length === 0) {
    return `I cannot find live sensor data yet. ${context.guidance}`;
  }

  const biggestWarning = [...available].sort((a, b) => b.warningCount - a.warningCount)[0];
  const fastestRise = [...available]
    .filter((d) => d.delta != null)
    .sort((a, b) => (b.delta || 0) - (a.delta || 0))[0];

  if (normalizedQuestion.includes('influence') || normalizedQuestion.includes('driver') || normalizedQuestion.includes('what influences')) {
    return [
      'Likely influences are inferred from co-occurring sensor behavior and current route context.',
      fastestRise ? `• Strongest recent upward movement: ${fastestRise.label} (${fastestRise.delta >= 0 ? '+' : ''}${fastestRise.delta.toFixed(2)} over the recent window).` : null,
      biggestWarning ? `• Highest anomaly volume: ${biggestWarning.label} with ${biggestWarning.warningCount} warning/danger records.` : null,
      `• Route guidance: ${context.guidance}`,
      'Use this as directional guidance and confirm with physical inspection / operational logs.',
    ].filter(Boolean).join('\n');
  }

  if (normalizedQuestion.includes('anomal') || normalizedQuestion.includes('trend')) {
    return [
      'Trend and anomaly summary from recent live history:',
      ...available.map((item) => {
        const trend = item.delta == null ? 'no clear numeric trend' : `${item.delta >= 0 ? 'rising' : 'falling'} (${item.delta.toFixed(2)})`;
        return `• ${item.label}: ${item.metricKey || 'primary metric'} is ${item.current ?? 'n/a'}, trend is ${trend}, anomalies=${item.warningCount}.`;
      }),
      `Route hint: ${context.guidance}`,
    ].join('\n');
  }

  return [
    'Current decision-oriented snapshot:',
    ...available.map((item) => `• ${item.label}: current ${item.metricKey || 'metric'}=${item.current ?? 'n/a'}, status=${item.latestStatus || 'unknown'}, anomalies=${item.warningCount}.`),
    biggestWarning ? `Priority focus: ${biggestWarning.label} (highest anomaly count).` : null,
    `Route hint: ${context.guidance}`,
    'Ask follow-ups like “what influences X?”, “why is this rising?”, or “what should we do first?”.',
  ].filter(Boolean).join('\n');
}

async function callOpenAiCompatible({ apiUrl, apiKey, model, question, context }) {
  const endpoint = `${apiUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'You are Analytics Copilot for a smart-kitchen dashboard. Provide concise, decision-oriented analysis, explain trends/anomalies, and include route-aware guidance in your answer.',
        },
        {
          role: 'system',
          content: `Live dashboard context JSON:\n${JSON.stringify(context, null, 2)}`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed (${response.status})`);
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.trim() || 'No response generated by the LLM.';
}

export default function AnalyticsChatbot() {
  const location = useLocation();
  const overview = useOverviewData();
  const scrollRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'intro',
      role: 'assistant',
      text: 'Hi, I am Analytics Copilot. I can answer natural-language questions using live gas, temperature/humidity, fridge, and fire context.',
    },
  ]);

  const context = useMemo(() => buildContext(overview, location.pathname), [overview, location.pathname]);

  useEffect(() => {
    setMessages((prev) => {
      const routeMessage = {
        id: `route-${location.pathname}`,
        role: 'assistant',
        text: `Route guidance: ${context.guidance}`,
      };

      if (prev[prev.length - 1]?.id === routeMessage.id) {
        return prev;
      }

      return [...prev, routeMessage];
    });
  }, [location.pathname, context.guidance]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

  const llmConfig = {
    apiUrl: import.meta.env.VITE_LLM_API_URL,
    apiKey: import.meta.env.VITE_LLM_API_KEY,
    model: import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini',
  };

  const sendMessage = async (promptText) => {
    const question = (promptText ?? input).trim();
    if (!question || isSending) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: question }]);
    setInput('');
    setIsSending(true);

    const hasRemoteConfig = Boolean(llmConfig.apiUrl && llmConfig.apiKey);

    try {
      const responseText = hasRemoteConfig
        ? await callOpenAiCompatible({ ...llmConfig, question, context })
        : buildLocalFallbackResponse(question, context);

      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: responseText }]);
    } catch (error) {
      const fallbackText = `${buildLocalFallbackResponse(question, context)}\n\n(Using local fallback because remote LLM was unavailable.)`;
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: fallbackText }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="analytics-chatbot">
      <button
        type="button"
        className="analytics-chatbot-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle Analytics Copilot"
      >
        {isOpen ? <X size={18} /> : <MessageCircle size={18} />}
        <span>Analytics Copilot</span>
      </button>

      {isOpen && (
        <section className="analytics-chatbot-panel" aria-label="Analytics Copilot panel">
          <header className="analytics-chatbot-header">
            <div>
              <strong>Analytics Copilot</strong>
              <p>{context.guidance}</p>
            </div>
            <Sparkles size={16} />
          </header>

          <div className="analytics-chatbot-messages" ref={scrollRef}>
            {messages.map((message) => (
              <article key={message.id} className={`chat-bubble ${message.role}`}>
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          <div className="analytics-chatbot-prompts">
            {DEFAULT_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" onClick={() => sendMessage(prompt)} disabled={isSending}>
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="analytics-chatbot-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={2}
              placeholder="Ask about trends, anomalies, or what influences a metric..."
            />
            <button type="submit" disabled={isSending || !input.trim()}>
              <SendHorizontal size={16} />
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
