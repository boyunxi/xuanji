package store

import (
	"fmt"
	"strings"
	"time"

	"xuanji-backend/internal/model"
)

// GetShopItems returns mall commodities filtered by game, category, status, and search query
func (s *DataStore) GetShopItems(game, category, status, query string) []model.ShopItem {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []model.ShopItem
	q := strings.ToLower(strings.TrimSpace(query))

	for _, item := range s.ShopItems {
		if game != "" && game != "全部游戏" && game != "all" && item.Game != game && item.Game != "全部游戏" {
			continue
		}
		if category != "" && category != "全部" && category != "all" && item.Category != category {
			continue
		}
		if status != "" && status != "全部状态" && status != "all" && item.Status != status {
			continue
		}
		if q != "" {
			match := strings.Contains(strings.ToLower(item.ID), q) ||
				strings.Contains(strings.ToLower(item.Name), q) ||
				strings.Contains(strings.ToLower(item.Description), q) ||
				strings.Contains(strings.ToLower(item.Items), q) ||
				strings.Contains(strings.ToLower(item.Tag), q)
			if !match {
				continue
			}
		}
		result = append(result, item)
	}

	return result
}

// GetShopItemByID retrieves a shop item by ID
func (s *DataStore) GetShopItemByID(id string) (*model.ShopItem, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, it := range s.ShopItems {
		if it.ID == id {
			copy := it
			return &copy, true
		}
	}
	return nil, false
}

// CreateShopItem creates a new mall commodity
func (s *DataStore) CreateShopItem(item model.ShopItem) (*model.ShopItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if strings.TrimSpace(item.Name) == "" {
		return nil, fmt.Errorf("商品名称不能为空")
	}
	if item.Price <= 0 {
		return nil, fmt.Errorf("商品售价必须大于0")
	}
	if item.OriginalPrice <= 0 {
		item.OriginalPrice = item.Price
	}
	if item.Game == "" {
		item.Game = "全部游戏"
	}
	if item.Category == "" {
		item.Category = "超值礼包"
	}
	if item.Currency == "" {
		item.Currency = "仙玉"
	}
	if item.Status == "" {
		item.Status = "上架中"
	}
	if item.BuyLimit == "" {
		item.BuyLimit = "不限购"
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	item.ID = fmt.Sprintf("SHOP_%d", time.Now().UnixNano()%1000000)
	item.CreatedAt = now
	item.UpdatedAt = now

	s.ShopItems = append([]model.ShopItem{item}, s.ShopItems...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec(`INSERT INTO shop_items (id, name, game, category, currency, price, original_price, stock, buy_limit, tag, description, items, status, sort_order, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
			item.ID, item.Name, item.Game, item.Category, item.Currency, item.Price, item.OriginalPrice, item.Stock, item.BuyLimit, item.Tag, item.Description, item.Items, item.Status, item.SortOrder, item.CreatedAt, item.UpdatedAt)
	}

	return &item, nil
}

// UpdateShopItem updates an existing mall commodity
func (s *DataStore) UpdateShopItem(id string, update model.ShopItem) (*model.ShopItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.ShopItems {
		if s.ShopItems[i].ID == id {
			if strings.TrimSpace(update.Name) != "" {
				s.ShopItems[i].Name = update.Name
			}
			if update.Game != "" {
				s.ShopItems[i].Game = update.Game
			}
			if update.Category != "" {
				s.ShopItems[i].Category = update.Category
			}
			if update.Currency != "" {
				s.ShopItems[i].Currency = update.Currency
			}
			if update.Price > 0 {
				s.ShopItems[i].Price = update.Price
			}
			if update.OriginalPrice > 0 {
				s.ShopItems[i].OriginalPrice = update.OriginalPrice
			}
			s.ShopItems[i].Stock = update.Stock
			if update.BuyLimit != "" {
				s.ShopItems[i].BuyLimit = update.BuyLimit
			}
			s.ShopItems[i].Tag = update.Tag
			s.ShopItems[i].Description = update.Description
			s.ShopItems[i].Items = update.Items
			if update.Status != "" {
				s.ShopItems[i].Status = update.Status
			}
			s.ShopItems[i].SortOrder = update.SortOrder
			s.ShopItems[i].UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

			_ = s.saveUnlocked()

			if s.db != nil {
				_, _ = s.db.Exec(`UPDATE shop_items SET name=$1, game=$2, category=$3, currency=$4, price=$5, original_price=$6, stock=$7, buy_limit=$8, tag=$9, description=$10, items=$11, status=$12, sort_order=$13, updated_at=$14 WHERE id=$15`,
					s.ShopItems[i].Name, s.ShopItems[i].Game, s.ShopItems[i].Category, s.ShopItems[i].Currency, s.ShopItems[i].Price, s.ShopItems[i].OriginalPrice, s.ShopItems[i].Stock, s.ShopItems[i].BuyLimit, s.ShopItems[i].Tag, s.ShopItems[i].Description, s.ShopItems[i].Items, s.ShopItems[i].Status, s.ShopItems[i].SortOrder, s.ShopItems[i].UpdatedAt, id)
			}

			copy := s.ShopItems[i]
			return &copy, nil
		}
	}

	return nil, fmt.Errorf("shop item not found: %s", id)
}

// ToggleShopItemStatus toggles commodity status between "上架中" and "已下架"
func (s *DataStore) ToggleShopItemStatus(id string) (*model.ShopItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.ShopItems {
		if s.ShopItems[i].ID == id {
			if s.ShopItems[i].Status == "上架中" {
				s.ShopItems[i].Status = "已下架"
			} else {
				s.ShopItems[i].Status = "上架中"
			}
			s.ShopItems[i].UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
			_ = s.saveUnlocked()

			if s.db != nil {
				_, _ = s.db.Exec(`UPDATE shop_items SET status=$1, updated_at=$2 WHERE id=$3`,
					s.ShopItems[i].Status, s.ShopItems[i].UpdatedAt, id)
			}

			copy := s.ShopItems[i]
			return &copy, nil
		}
	}

	return nil, fmt.Errorf("shop item not found: %s", id)
}

// DeleteShopItem deletes a commodity by ID
func (s *DataStore) DeleteShopItem(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i := range s.ShopItems {
		if s.ShopItems[i].ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("shop item not found: %s", id)
	}

	s.ShopItems = append(s.ShopItems[:idx], s.ShopItems[idx+1:]...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec(`DELETE FROM shop_items WHERE id=$1`, id)
	}

	return nil
}
