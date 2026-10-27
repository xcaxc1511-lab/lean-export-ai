import {
  BarChart3,
  Columns2,
  Heading,
  HelpCircle,
  Image,
  Lightbulb,
  List,
  Minus,
  MousePointerClick,
  Pilcrow,
  Quote,
  Table,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type { BlockType } from "@/lib/blocks";

export interface Widget {
  type: BlockType;
  label: string;
  icon: LucideIcon;
  group: "basic" | "media" | "aeo";
}

/** Widgets shown in the builder's left panel, in display order. */
export const WIDGETS: Widget[] = [
  { type: "heading", label: "Tiêu đề", icon: Heading, group: "basic" },
  { type: "paragraph", label: "Đoạn văn", icon: Pilcrow, group: "basic" },
  { type: "list", label: "Danh sách", icon: List, group: "basic" },
  { type: "quote", label: "Trích dẫn", icon: Quote, group: "basic" },
  { type: "button", label: "Nút bấm", icon: MousePointerClick, group: "basic" },
  { type: "divider", label: "Đường kẻ", icon: Minus, group: "basic" },
  { type: "image", label: "Ảnh", icon: Image, group: "media" },
  { type: "media-text", label: "Ảnh + chữ", icon: Columns2, group: "media" },
  { type: "video", label: "Video YouTube", icon: Youtube, group: "media" },
  { type: "table", label: "Bảng", icon: Table, group: "media" },
  { type: "faq", label: "Hỏi đáp (FAQ)", icon: HelpCircle, group: "aeo" },
  { type: "stats", label: "Số liệu nổi bật", icon: BarChart3, group: "aeo" },
  { type: "callout", label: "Hộp nổi bật", icon: Lightbulb, group: "aeo" },
];

export const WIDGET_GROUPS: { id: Widget["group"]; label: string; hint?: string }[] = [
  { id: "basic", label: "Cơ bản" },
  { id: "media", label: "Hình ảnh & dữ liệu" },
  { id: "aeo", label: "Tăng điểm AEO/GEO", hint: "Khối giúp bài dễ được AI trích dẫn" },
];

export const widgetOf = (type: BlockType) => WIDGETS.find((w) => w.type === type)!;

/** Drag payload type for widgets dragged from the panel / blocks being moved. */
export const DND_NEW = "application/x-lx-new-block";
export const DND_MOVE = "application/x-lx-move-block";
