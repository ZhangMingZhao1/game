import {
  PASSIVE_ITEMS,
  POD_WEAPONS,
  TIER_COLORS,
  type PassiveItemConfig,
  type PodWeaponConfig,
} from '../data/config';
import type { ShopOfferView } from '../ui/screens';

export interface ShopState {
  offers: ShopOfferView[];
  rerolls: number;
  serial: number;
}

export interface ShopContext {
  wave: number;
  luck: number;
  scrap: number;
  itemIds: string[];
}

export function createShopState(): ShopState {
  return { offers: [], rerolls: 0, serial: 0 };
}

function weightedTier(wave: number, luck: number, random: () => number): number {
  const boost = Math.min(0.22, Math.max(0, luck) / 420) + Math.min(0.18, wave / 65);
  const roll = random() - boost;
  if (roll < 0.04) return 3;
  if (roll < 0.18) return 2;
  if (roll < 0.53) return 1;
  return 0;
}

function podPrice(pod: PodWeaponConfig, tier: number, wave: number) {
  return Math.round(pod.baseCost * (1 + tier * 0.95) * (1 + Math.max(0, wave - 1) * 0.025));
}

function itemPrice(item: PassiveItemConfig, wave: number) {
  return Math.round(item.cost * (1 + Math.max(0, wave - 1) * 0.02));
}

export function generateShop(
  state: ShopState,
  context: ShopContext,
  random: () => number = Math.random,
  keepLocked = true
): ShopOfferView[] {
  const locked = keepLocked ? state.offers.filter((offer) => offer.locked && !offer.sold) : [];
  const offers: ShopOfferView[] = [...locked];

  while (offers.length < 4) {
    const choosePod = random() < 0.62;
    if (choosePod) {
      const pod = POD_WEAPONS[Math.floor(random() * POD_WEAPONS.length)];
      const tier = weightedTier(context.wave, context.luck, random);
      offers.push({
        key: `offer-${state.serial++}`,
        type: 'pod',
        data: pod,
        tier,
        price: podPrice(pod, tier, context.wave),
        sold: false,
        locked: false,
      });
    } else {
      const available = PASSIVE_ITEMS.filter((item) => !context.itemIds.includes(item.id));
      const source = available.length ? available : PASSIVE_ITEMS;
      const item = source[Math.floor(random() * source.length)];
      offers.push({
        key: `offer-${state.serial++}`,
        type: 'item',
        data: item,
        tier: item.tier,
        price: itemPrice(item, context.wave),
        sold: false,
        locked: false,
      });
    }
  }
  state.offers = offers.slice(0, 4);
  return state.offers;
}

export function rerollCost(state: ShopState) {
  return 6 + state.rerolls * 5;
}

export function markBought(state: ShopState, key: string): ShopOfferView | null {
  const offer = state.offers.find((entry) => entry.key === key);
  if (!offer || offer.sold) return null;
  offer.sold = true;
  return offer;
}

export function toggleOfferLock(state: ShopState, key: string) {
  const offer = state.offers.find((entry) => entry.key === key);
  if (offer && !offer.sold) offer.locked = !offer.locked;
}

export function itemDisplayColor(offer: ShopOfferView) {
  if (offer.type === 'item') return (offer.data as PassiveItemConfig).color;
  return TIER_COLORS[Math.max(0, Math.min(3, offer.tier))];
}
