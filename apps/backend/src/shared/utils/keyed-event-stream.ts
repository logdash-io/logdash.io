import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, Subject } from 'rxjs';

export class KeyedEventStream<T> {
  private readonly subjects = new Map<string, Subject<T>>();

  constructor(eventEmitter: EventEmitter2, eventName: string, keyOf: (event: T) => string) {
    eventEmitter.on(eventName, (event: T) => this.subjects.get(keyOf(event))?.next(event));
  }

  public stream(key: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      const subject = this.subjects.get(key) ?? new Subject<T>();
      this.subjects.set(key, subject);

      const subscription = subject.subscribe(subscriber);

      return () => {
        subscription.unsubscribe();

        if (!subject.observed) {
          this.subjects.delete(key);
        }
      };
    });
  }
}
