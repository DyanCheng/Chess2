import { Card, CardEffectType } from '../types/card';

export type SkillCardCategory = 'Buff' | 'Debuff' | 'Special' | 'Utility' | 'Counter';

export interface SkillCard extends Card {
  category: SkillCardCategory;
  effectLabel: string;
  durationLabel: string;
  illustration: string;
}

const defineCard = (
  id: string,
  name: string,
  description: string,
  effectType: CardEffectType,
  rarity: Card['rarity'],
  category: SkillCardCategory,
  effectLabel: string,
  durationLabel: string,
  illustration: string,
): SkillCard => ({
  id: `skill_${id}`,
  name,
  description,
  effectType,
  rarity,
  category,
  effectLabel,
  durationLabel,
  illustration,
  manaCost: 0,
  iconUrl: illustration,
  effectAnimation: effectType,
  price: 0,
  currencyType: 'gold',
  isOwned: true,
  quantity: 1,
  maxPerGame: 1,
  cooldownTurns: 0,
});

export const SKILL_CARDS: SkillCard[] = [
  defineCard('pawn_step', 'Đi Tốt', 'Một quân Tốt tiến thêm một ô và được bảo vệ khỏi bắt quân, đóng băng, phá hủy.', 'pawn_step', 'common', 'Buff', 'Tăng bước · Bất bại', 'Tới khi kết thúc lượt kế tiếp', '♟'),
  defineCard('freeze', 'Freeze', 'Khóa một quân đối thủ, quân đó bỏ lỡ lượt đi kế tiếp.', 'freeze', 'rare', 'Debuff', 'Khóa quân', '1 lượt đối thủ', '❄'),
  defineCard('trump', 'Trump', 'Đánh dấu một ô. Sau ba lượt đi, phá hủy quân đứng trên ô đó.', 'trump', 'epic', 'Special', 'Đánh dấu ô', '3 lượt đi', '♛'),
  defineCard('back_to_future', 'Back to Future', 'Khôi phục bàn cờ về trạng thái ngay trước nước đi gần nhất.', 'back_to_future', 'epic', 'Special', 'Hoàn tác nước đi', 'Tức thì', '⏳'),
  defineCard('high_risk', 'High Risk', 'Khóa quân địch trong 7 lượt; nếu còn trên bàn, quân đó chịu sát thương gấp đôi khi bị bắt.', 'high_risk', 'legendary', 'Debuff', 'Khóa · Tăng sát thương', '7 lượt đi', '⛓'),
  defineCard('arsenal', 'Arsenal', 'Chọn quân của bạn để miễn nhiễm đóng băng và không thể bị bắt trong 3 lượt.', 'arsenal', 'rare', 'Buff', 'Bất bại', '3 lượt đi', '🛡'),
  defineCard('mu', 'Mu', 'Tốt của bạn có thể đi lùi trong phần còn lại của trận đấu.', 'mu', 'rare', 'Buff', 'Tốt đi lùi', 'Vĩnh viễn', '↶'),
  defineCard('portal', 'Portal', 'Hoán đổi vị trí hai quân không phải Vua. Kích hoạt sẽ kết thúc lượt ngay.', 'portal', 'epic', 'Special', 'Hoán đổi quân', 'Tức thì · kết thúc lượt', '🌀'),
  defineCard('start', 'Start?', 'Trong nước đi đầu tiên, hoán đổi một Tốt ở hàng xuất phát với quân cùng cột.', 'start', 'common', 'Special', 'Hoán đổi hàng xuất phát', 'Chỉ lượt đầu', '⇅'),
  defineCard('fortune', 'Thần Tài', 'Hy sinh 80% HP hiện tại để triệu hồi một Hậu vào ô trống.', 'fortune', 'legendary', 'Utility', 'Triệu hồi Hậu', 'Tức thì', '♕'),
  defineCard('bring_back', 'Bring Back', 'Đưa một quân đã bị bắt trở lại một ô trống trên bàn.', 'bring_back', 'legendary', 'Utility', 'Hồi sinh quân', 'Tức thì', '✨'),
  defineCard('arsenal_plus', 'Tượng?', 'Mỗi lượt khi còn giữ lá Arsenal, tăng thời gian bảo vệ của Arsenal thêm một lượt.', 'arsenal_plus', 'rare', 'Utility', 'Cường hóa Arsenal', 'Tới khi dùng Arsenal', '♗'),
  defineCard('hide_king', 'Hide King', 'Đổi Vua với Xe gần nhất. Nếu không có Xe, lá bài bị tiêu hao.', 'hide_king', 'epic', 'Special', 'Ẩn Vua', 'Tức thì', '♚'),
  defineCard('transformer', 'Transformer', 'Chọn quân đại diện; hợp nhất các quân còn lại cùng phe và kế thừa kiểu di chuyển của chúng.', 'transformer', 'legendary', 'Special', 'Hợp nhất quân', 'Tới hết trận', '⚡'),
  defineCard('vckbla', 'VCKBLA', 'Đầu hàng và kết thúc ván đấu ngay lập tức.', 'vckbla', 'common', 'Counter', 'Đầu hàng', 'Tức thì', '⚑'),
  defineCard('shuffle', 'Shuffle', 'Xáo trộn các lá còn trên tay.', 'shuffle', 'common', 'Utility', 'Xáo bài', 'Tức thì', '🔀'),
  defineCard('greed', 'Tham Lam', 'Rút tối đa hai lá từ chồng bài của bạn.', 'greed', 'rare', 'Utility', 'Rút 2 lá', 'Tức thì', '✦'),
  defineCard('block', 'Chặn Đê', 'Đối thủ bỏ ngẫu nhiên một lá đang giữ.', 'block', 'rare', 'Counter', 'Loại 1 lá đối thủ', 'Tức thì', '⊘'),
  defineCard('nope', 'Nope', 'Hủy hiệu ứng của lá đối thủ vừa kích hoạt.', 'nope', 'rare', 'Counter', 'Hủy lá bài', 'Phản ứng', '✋'),
  defineCard('copy', 'Copy', 'Sao chép hiệu ứng lá bài gần nhất của đối thủ.', 'copy', 'epic', 'Counter', 'Sao chép hiệu ứng', 'Tức thì', '▧'),
  defineCard('tele', 'Tele', 'Dịch chuyển một quân của bạn tới một ô trống ngẫu nhiên.', 'tele', 'epic', 'Counter', 'Dịch chuyển', 'Tức thì', '◈'),
  defineCard('mosquito', 'Muỗi', 'Khóa một quân đối thủ và gây 1 sát thương HP sau mỗi lượt đi cho tới khi quân đó bị bắt.', 'mosquito', 'rare', 'Debuff', 'Khóa · Độc 1 HP', 'Tới khi bị bắt', '♟'),
  defineCard('matrix', 'Matrix', 'Cần ít nhất 5 quân trên đường chéo a1–h8. Bảo vệ các quân của bạn trên đường chéo.', 'matrix', 'legendary', 'Special', 'Bất bại trên đường chéo', '3 lượt đi', '▦'),
];

export const SKILL_CARD_BY_ID = Object.fromEntries(
  SKILL_CARDS.map(card => [card.id, card]),
) as Record<string, SkillCard>;
