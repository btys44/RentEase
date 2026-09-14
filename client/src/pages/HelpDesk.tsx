import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FAQ_ITEMS } from '../utils/faqData';
import api from '../utils/api';

export default function HelpDesk() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const relevantItems = useMemo(() => {
    const roleCategory = user?.role
      ? user.role.charAt(0) + user.role.slice(1).toLowerCase()
      : null;

    return FAQ_ITEMS.filter((item) => {
      const isGeneralCategory = ['General', 'Account', 'Payments', 'Maintenance'].includes(item.category);
      const isMyRoleCategory = item.category === roleCategory;
      return isGeneralCategory || isMyRoleCategory;
    });
  }, [user]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return relevantItems;
    const q = search.toLowerCase();
    return relevantItems.filter(
      (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    );
  }, [search, relevantItems]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help Desk</h1>
        <p className="text-gray-500 text-sm">Answers to common questions about using RentEase Kenya</p>
      </div>

      <AskAssistant />

      <input
        className="input-field"
        placeholder="Search for a question..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card divide-y divide-gray-100">
        {filteredItems.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No matching questions found.</p>
        ) : (
          filteredItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="py-3">
                <button
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="font-medium text-sm text-gray-900">{item.question}</span>
                  <span className="text-gray-400 text-lg">{isOpen ? '\u2212' : '+'}</span>
                </button>
                {isOpen && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.answer}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AskAssistant() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setAnswer('');
    try {
      const res = await api.post('/helpdesk/ask', { question });
      setAnswer(res.data.answer);
    } catch (err) {
      setAnswer('Sorry, the assistant is unavailable right now. Please try the FAQ below or contact your landlord.');
    } finally {
      setAsking(false);
    }
  }

  return (
    <form onSubmit={handleAsk} className="card space-y-3">
      <label className="label">Ask the RentEase Assistant</label>
      <div className="flex gap-2">
        <input
          className="input-field"
          placeholder="e.g. How do I see who hasn't paid rent this month?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" disabled={asking} className="btn-primary whitespace-nowrap">
          {asking ? 'Asking...' : 'Ask'}
        </button>
      </div>
      {answer && (
        <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 text-sm text-gray-800">
          {answer}
        </div>
      )}
    </form>
  );
}