'use client';

import { useEffect, useState } from 'react';
import { Loader2, Shield } from 'lucide-react';

export function ScrollableFeed() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Array<{
    id: string;
    type: string;
    agent: string;
    time: string;
    details: string;
  }>>([]);
  
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      // Mock event data
      const mockEvents = [
        {
          id: '1',
          type: 'Registered',
          agent: 'mcp://sentiment.text-analysis.acme.v1.0',
          time: '2 min ago',
          details: 'New registration with 0.5 SOL stake',
        },
        {
          id: '2',
          type: 'Endpoint verified',
          agent: 'mcp://translation.english-solver.acme.v1.2',
          time: '15 min ago',
          details: 'Endpoint verified after challenge',
        },
        {
          id: '3',
          type: 'Challenge passed',
          agent: 'mcp://web-search.lucide.v1.0',
          time: '45 min ago',
          details: 'Challenge passed successfully',
        },
        {
          id: '4',
          type: 'Sold',
          agent: 'mcp://trading-signals.alchemy.v1.0',
          time: '1 hour ago',
          details: 'Sold for 2.5 SOL',
        },
      ];
      setEvents(mockEvents);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-muted mr-2" />
        <span className="text-muted">Loading activity...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className={`flex items-start gap-3 p-3 bg-surface rounded-xl border border-explorer/5 transition-colors`}
        >
          <div className="w-8 h-8 rounded bg-explorer/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-explorer truncate">
              {event.type}: {event.agent}
            </p>
            <p className="text-xs text-muted truncate">
              {event.details}
            </p>
          </div>
          <p className="text-xs text-muted">{event.time}</p>
        </div>
      ))}
    </div>
  );
}
