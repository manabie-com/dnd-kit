import {useState} from 'react';
import {useIsomorphicLayoutEffect} from '@dnd-kit/utilities';

import type {ClientRect} from '../../types';
import {getClientRect, Rect} from '../../utilities';

import {useMutationObserver} from './useMutationObserver';
import {useResizeObserver} from './useResizeObserver';

function defaultMeasure(element: HTMLElement) {
  return new Rect(getClientRect(element), element);
}

export function useRect(
  element: HTMLElement | null,
  measure: (element: HTMLElement) => ClientRect = defaultMeasure,
  fallbackRect?: ClientRect | null
) {
  const [rect, setRect] = useState<ClientRect | null>(null);

  function measureRect() {
    setRect((currentRect): ClientRect | null => {
      if (!element) {
        return null;
      }
  
      if (element.isConnected === false) {
        // Fall back to last rect we measured if the element is
        // no longer connected to the DOM.
        return currentRect ?? fallbackRect ?? null;
      }
  
      const newRect = measure(element);
  
      if (JSON.stringify(currentRect) === JSON.stringify(newRect)) {
        return currentRect;
      }
  
      return newRect;
    });
  }
  
  const mutationObserver = useMutationObserver({
    callback(records) {
      if (!element) {
        return;
      }

      for (const record of records) {
        const {type, target} = record;

        if (
          type === 'childList' &&
          target instanceof HTMLElement &&
          target.contains(element)
        ) {
          measureRect();
          break;
        }
      }
    },
  });
  const resizeObserver = useResizeObserver({callback: measureRect});

  useIsomorphicLayoutEffect(() => {
    measureRect();

    if (element) {
      resizeObserver?.observe(element);
      // Salesforce LWS blocks observing shared elements such as <body>. Watch the element's
      // parent subtree instead, and if the parent IS body (or missing), fall back to the
      // element itself. Functional impact is negligible for typical drag-drop UIs.
      const mutationTarget =
        element.parentElement && element.parentElement !== document.body
          ? element.parentElement
          : element;
      mutationObserver?.observe(mutationTarget, {
        childList: true,
        subtree: true,
      });
    } else {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    }
  }, [element]);

  return rect;
}
