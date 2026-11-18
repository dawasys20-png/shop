import {
  FaBone,
  FaCapsules,
  FaDumbbell,
  FaFish,
  FaHeart,
  FaHeartbeat,
  FaLeaf,
  FaSeedling,
  FaShieldAlt,
  FaStar,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import type { ProductCategoryIcon } from "../lib/products";

const categoryIcons: Record<ProductCategoryIcon, IconType> = {
  pill: FaCapsules,
  leaf: FaLeaf,
  dumbbell: FaDumbbell,
  sprout: FaSeedling,
  fish: FaFish,
  activity: FaHeartbeat,
  "shield-check": FaShieldAlt,
  bone: FaBone,
  heart: FaHeart,
  sparkles: FaStar,
};

export function CategoryIcon({
  icon,
  className,
}: {
  icon?: ProductCategoryIcon;
  className?: string;
}) {
  if (!icon) return null;

  const Icon = categoryIcons[icon];
  return <Icon className={className} aria-hidden="true" />;
}
