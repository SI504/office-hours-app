import { useState, useEffect } from "react";
import { Subject, interval, merge } from "rxjs";
import { debounceTime, map, withLatestFrom, filter } from "rxjs/operators";

export const useAutoRefresh = (refresh: () => void) => {
    const [interactions] = useState(() => {
        const subj = new Subject<boolean>();
        return subj;
    });
    const [interactionsEnable] = useState(() => {
        return interactions.pipe(
            debounceTime(6000),
            map(() => true),
        );
    });
    useEffect(() => {
        const subscription = interval(3000).pipe(
            withLatestFrom(merge(interactions, interactionsEnable)),
            map(v => v[1]),
            filter((v) => v),
        ).subscribe(() => {
            refresh()
        });
        interactions.next(true);
        return () => {
            subscription.unsubscribe();
        }
    }, []);
    return [interactions]
}