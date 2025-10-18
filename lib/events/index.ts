import EventEmitter from 'eventemitter3';

export interface TrendditEvent {
  type: string;
  payload: unknown;
  timestamp: Date;
  feature?: string;
  userId?: string;
}

class EventBus extends EventEmitter {
  private eventLog: TrendditEvent[] = [];

  emitEvent(event: string, payload: unknown): boolean {
    const trendditEvent: TrendditEvent = {
      type: event,
      payload,
      timestamp: new Date(),
      feature: event.split('.')[0],
    };

    // Log event for debugging
    this.eventLog.push(trendditEvent);
    
    // Keep only last 100 events in memory
    if (this.eventLog.length > 100) {
      this.eventLog.shift();
    }

    console.log('[Event]', event, payload);
    
    return this.emit(event, payload);
  }

  getEventLog(): TrendditEvent[] {
    return [...this.eventLog];
  }

  clearEventLog(): void {
    this.eventLog = [];
  }
}

// Singleton event bus
export const events = new EventBus();

// Type-safe event definitions
export const EVENTS = {
  // Trend events
  TREND_VIEWED: 'trend.viewed',
  TREND_EXPORTED: 'trend.exported',
  
  // Need events
  NEEDS_GENERATED: 'needs.generated',
  NEED_IDENTIFIED: 'need.identified',
  NEED_PRIORITIZED: 'need.prioritized',
  NEED_UPDATED: 'need.updated',
  NEEDS_PRIORITIZED: 'needs.prioritized',
  COMPANY_PROFILE_SAVED: 'company.profile_saved',
  
  // Solution events
  SOLUTION_MATCHED: 'solution.matched',
  SOLUTION_SELECTED: 'solution.selected',
  
  // Tech events
  TECH_STACK_GENERATED: 'tech.stack_generated',
  
  // Roadmap events
  ROADMAP_CREATED: 'roadmap.created',
  ROADMAP_MILESTONE_COMPLETED: 'roadmap.milestone_completed',
} as const;