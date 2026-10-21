package store

import (
	"fmt"
	"strings"
	"time"

	"xuanji-backend/internal/model"
)

// --- Events ---

func (s *DataStore) GetEvents(game, status, query string) []model.Event {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var res []model.Event
	q := strings.ToLower(strings.TrimSpace(query))
	for _, e := range s.Events {
		if game != "" && game != "全部游戏" && e.Game != game {
			continue
		}
		if status != "" && status != "全部状态" && e.Status != status {
			continue
		}
		if q != "" {
			titleMatch := strings.Contains(strings.ToLower(e.Title), q)
			idMatch := strings.Contains(strings.ToLower(e.ID), q)
			if !titleMatch && !idMatch {
				continue
			}
		}
		res = append(res, e)
	}
	return res
}

func (s *DataStore) GetEvent(id string) (*model.Event, bool) {
	return s.GetEventByID(id)
}

func (s *DataStore) GetEventByID(id string) (*model.Event, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, e := range s.Events {
		if e.ID == id {
			copy := e
			return &copy, true
		}
	}
	return nil, false
}

func (s *DataStore) CreateEvent(title, game, startDate string) (*model.Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if game == "" || game == "全部游戏" {
		game = "山海长歌"
	}
	if startDate == "" {
		startDate = dateFromNow(2)
	}

	parsedStart, err := time.Parse("2006-01-02", startDate)
	var endDate string
	if err == nil {
		endDate = parsedStart.AddDate(0, 0, 7).Format("2006-01-02")
	} else {
		endDate = dateFromNow(9)
	}

	newEvent := model.Event{
		ID:           fmt.Sprintf("EV%d", time.Now().UnixNano()%1000000),
		Title:        title,
		Game:         game,
		Start:        startDate,
		End:          endDate,
		Participants: 0,
		Status:       "未开始",
	}

	s.Events = append([]model.Event{newEvent}, s.Events...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec("INSERT INTO events (id, title, game, start_date, end_date, participants, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
			newEvent.ID, newEvent.Title, newEvent.Game, newEvent.Start, newEvent.End, newEvent.Participants, newEvent.Status)
	}
	s.invalidateRedis("xuanji:overview:*")
	return &newEvent, nil
}

func (s *DataStore) UpdateEventStatus(id, newStatus string) (*model.Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.Events {
		if s.Events[i].ID == id {
			s.Events[i].Status = newStatus
			if err := s.saveUnlocked(); err != nil {
				return nil, err
			}
			if s.db != nil {
				_, _ = s.db.Exec("UPDATE events SET status=$1 WHERE id=$2", newStatus, id)
			}
			s.invalidateRedis("xuanji:overview:*")
			copy := s.Events[i]
			return &copy, nil
		}
	}
	return nil, fmt.Errorf("event not found: %s", id)
}

// UpdateEvent updates event details including dates, title, and status
func (s *DataStore) UpdateEvent(id, title, game, start, end, status string) (*model.Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.Events {
		if s.Events[i].ID == id {
			if title != "" {
				s.Events[i].Title = title
			}
			if game != "" {
				s.Events[i].Game = game
			}
			if start != "" {
				s.Events[i].Start = start
			}
			if end != "" {
				s.Events[i].End = end
			}
			if status != "" {
				s.Events[i].Status = status
			}
			_ = s.saveUnlocked()
			if s.db != nil {
				_, _ = s.db.Exec(`UPDATE events SET title=$1, game=$2, start_date=$3, end_date=$4, status=$5 WHERE id=$6`,
					s.Events[i].Title, s.Events[i].Game, s.Events[i].Start, s.Events[i].End, s.Events[i].Status, id)
			}
			s.invalidateRedis("xuanji:overview:*")
			copy := s.Events[i]
			return &copy, nil
		}
	}
	return nil, fmt.Errorf("event not found: %s", id)
}

// ToggleEventStatus toggles event status between "进行中" and "已暂停" (or "未开始" -> "进行中")
func (s *DataStore) ToggleEventStatus(id string) (*model.Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.Events {
		if s.Events[i].ID == id {
			if s.Events[i].Status == "进行中" {
				s.Events[i].Status = "已暂停"
			} else {
				s.Events[i].Status = "进行中"
			}
			_ = s.saveUnlocked()
			if s.db != nil {
				_, _ = s.db.Exec("UPDATE events SET status=$1 WHERE id=$2", s.Events[i].Status, id)
			}
			s.invalidateRedis("xuanji:overview:*")
			copy := s.Events[i]
			return &copy, nil
		}
	}
	return nil, fmt.Errorf("event not found: %s", id)
}

// ResetEventData resets event runtime statistics (participants = 0)
func (s *DataStore) ResetEventData(id string) (*model.Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.Events {
		if s.Events[i].ID == id {
			s.Events[i].Participants = 0
			_ = s.saveUnlocked()
			if s.db != nil {
				_, _ = s.db.Exec("UPDATE events SET participants=0 WHERE id=$1", id)
			}
			s.invalidateRedis("xuanji:overview:*")
			copy := s.Events[i]
			return &copy, nil
		}
	}
	return nil, fmt.Errorf("event not found: %s", id)
}

// ResetEvent resets event cycle: resets participants, status to "未开始", and sets new 7-day period
func (s *DataStore) ResetEvent(id string) (*model.Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.Events {
		if s.Events[i].ID == id {
			s.Events[i].Participants = 0
			s.Events[i].Status = "未开始"
			s.Events[i].Start = dateFromNow(1)
			s.Events[i].End = dateFromNow(8)
			_ = s.saveUnlocked()
			if s.db != nil {
				_, _ = s.db.Exec("UPDATE events SET participants=0, status='未开始', start_date=$1, end_date=$2 WHERE id=$3",
					s.Events[i].Start, s.Events[i].End, id)
			}
			s.invalidateRedis("xuanji:overview:*")
			copy := s.Events[i]
			return &copy, nil
		}
	}
	return nil, fmt.Errorf("event not found: %s", id)
}

// DeleteEvent removes an event by ID
func (s *DataStore) DeleteEvent(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i := range s.Events {
		if s.Events[i].ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("event not found: %s", id)
	}

	s.Events = append(s.Events[:idx], s.Events[idx+1:]...)
	_ = s.saveUnlocked()
	if s.db != nil {
		_, _ = s.db.Exec("DELETE FROM events WHERE id=$1", id)
	}
	s.invalidateRedis("xuanji:overview:*")
	return nil
}

// --- Announcements ---

func (s *DataStore) GetAnnouncements(game, status, query string) []model.Announcement {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var res []model.Announcement
	q := strings.ToLower(strings.TrimSpace(query))
	for _, a := range s.Announcements {
		if game != "" && game != "全部游戏" && a.Game != game {
			continue
		}
		if status != "" && status != "全部状态" && a.Status != status {
			continue
		}
		if q != "" {
			titleMatch := strings.Contains(strings.ToLower(a.Title), q)
			contentMatch := strings.Contains(strings.ToLower(a.Content), q)
			idMatch := strings.Contains(strings.ToLower(a.ID), q)
			if !titleMatch && !contentMatch && !idMatch {
				continue
			}
		}
		res = append(res, a)
	}
	return res
}

func (s *DataStore) GetAnnouncement(id string) (*model.Announcement, bool) {
	return s.GetAnnouncementByID(id)
}

func (s *DataStore) GetAnnouncementByID(id string) (*model.Announcement, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, a := range s.Announcements {
		if a.ID == id {
			copy := a
			return &copy, true
		}
	}
	return nil, false
}

func (s *DataStore) CreateAnnouncement(title, game, content string) (*model.Announcement, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if game == "" || game == "全部游戏" {
		game = "山海长歌"
	}

	newAnn := model.Announcement{
		ID:      fmt.Sprintf("AN%d", time.Now().UnixNano()%1000000),
		Title:   title,
		Game:    game,
		Date:    dateFromNow(0),
		Content: content,
		Status:  "草稿",
	}

	s.Announcements = append([]model.Announcement{newAnn}, s.Announcements...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec("INSERT INTO announcements (id, title, game, date, content, status) VALUES ($1, $2, $3, $4, $5, $6)",
			newAnn.ID, newAnn.Title, newAnn.Game, newAnn.Date, newAnn.Content, newAnn.Status)
	}
	s.invalidateRedis("xuanji:overview:*")
	return &newAnn, nil
}

func (s *DataStore) UpdateAnnouncementStatus(id, newStatus string) (*model.Announcement, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.Announcements {
		if s.Announcements[i].ID == id {
			s.Announcements[i].Status = newStatus
			if err := s.saveUnlocked(); err != nil {
				return nil, err
			}
			if s.db != nil {
				_, _ = s.db.Exec("UPDATE announcements SET status=$1 WHERE id=$2", newStatus, id)
			}
			s.invalidateRedis("xuanji:overview:*")
			copy := s.Announcements[i]
			return &copy, nil
		}
	}
	return nil, fmt.Errorf("announcement not found: %s", id)
}

func (s *DataStore) DeleteAnnouncement(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i, a := range s.Announcements {
		if a.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("announcement not found: %s", id)
	}

	s.Announcements = append(s.Announcements[:idx], s.Announcements[idx+1:]...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec("DELETE FROM announcements WHERE id=$1", id)
	}
	s.invalidateRedis("xuanji:overview:*")
	return nil
}

// --- Orders ---

func (s *DataStore) GetOrders(game, status, query string) []model.Order {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var res []model.Order
	q := strings.ToLower(strings.TrimSpace(query))
	for _, o := range s.Orders {
		if game != "" && game != "全部游戏" && o.Game != game {
			continue
		}
		if status != "" && status != "全部状态" && o.Status != status {
			continue
		}
		if q != "" {
			playerMatch := strings.Contains(strings.ToLower(o.Player), q)
			idMatch := strings.Contains(strings.ToLower(o.ID), q)
			if !playerMatch && !idMatch {
				continue
			}
		}
		res = append(res, o)
	}
	return res
}

func (s *DataStore) GetOrder(id string) (*model.Order, bool) {
	return s.GetOrderByID(id)
}

func (s *DataStore) GetOrderByID(id string) (*model.Order, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, o := range s.Orders {
		if o.ID == id {
			copy := o
			return &copy, true
		}
	}
	return nil, false
}

func (s *DataStore) UpdateOrderStatus(id, newStatus string) (*model.Order, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.Orders {
		if s.Orders[i].ID == id {
			s.Orders[i].Status = newStatus
			if err := s.saveUnlocked(); err != nil {
				return nil, err
			}
			if s.db != nil {
				_, _ = s.db.Exec("UPDATE orders SET status=$1 WHERE id=$2", newStatus, id)
			}
			s.invalidateRedis("xuanji:overview:*")
			copy := s.Orders[i]
			return &copy, nil
		}
	}
	return nil, fmt.Errorf("order not found: %s", id)
}
