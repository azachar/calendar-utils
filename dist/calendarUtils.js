import endOfDay from 'date-fns/end_of_day';
import addMinutes from 'date-fns/add_minutes';
import differenceInDays from 'date-fns/difference_in_days';
import startOfDay from 'date-fns/start_of_day';
import isSameDay from 'date-fns/is_same_day';
import getDay from 'date-fns/get_day';
import startOfWeek from 'date-fns/start_of_week';
import addDays from 'date-fns/add_days';
import endOfWeek from 'date-fns/end_of_week';
import differenceInSeconds from 'date-fns/difference_in_seconds';
import startOfMonth from 'date-fns/start_of_month';
import endOfMonth from 'date-fns/end_of_month';
import isSameMonth from 'date-fns/is_same_month';
import isSameSecond from 'date-fns/is_same_second';
import setHours from 'date-fns/set_hours';
import setMinutes from 'date-fns/set_minutes';
import startOfMinute from 'date-fns/start_of_minute';
import differenceInMinutes from 'date-fns/difference_in_minutes';
import addHours from 'date-fns/add_hours';
var WEEKEND_DAY_NUMBERS = [0, 6];
var DAYS_IN_WEEK = 7;
var HOURS_IN_DAY = 24;
var MINUTES_IN_HOUR = 60;
function getExcludedDays(_a) {
    var startDate = _a.startDate, days = _a.days, excluded = _a.excluded;
    if (excluded.length < 1) {
        return 0;
    }
    var day = startDate.getDay();
    var reduce = 0;
    for (var i = 0; i < days; i++) {
        if (day === DAYS_IN_WEEK) {
            day = 0;
        }
        if (excluded.some(function (e) { return e === day; })) {
            reduce++;
        }
        day++;
    }
    return reduce;
}
function getWeekViewEventSpan(_a) {
    var event = _a.event, offset = _a.offset, startOfWeek = _a.startOfWeek, excluded = _a.excluded, _b = _a.weekViewDays, weekViewDays = _b === void 0 ? DAYS_IN_WEEK : _b;
    var begin = event.start < startOfWeek ? startOfWeek : event.start;
    var span = 1;
    if (event.end) {
        span = differenceInDays(addMinutes(endOfDay(event.end), 1), startOfDay(begin));
    }
    var totalLength = offset + span;
    if (totalLength > weekViewDays) {
        span = weekViewDays - offset;
    }
    return span - getExcludedDays({ startDate: begin, days: span, excluded: excluded });
}
export function getWeekViewEventOffset(_a) {
    var event = _a.event, startOfWeek = _a.startOfWeek, _b = _a.excluded, excluded = _b === void 0 ? [] : _b;
    if (event.start < startOfWeek) {
        return 0;
    }
    var distance = differenceInDays(event.start, startOfWeek);
    return distance - getExcludedDays({ startDate: startOfWeek, days: distance, excluded: excluded });
}
function isEventIsPeriod(_a) {
    var event = _a.event, periodStart = _a.periodStart, periodEnd = _a.periodEnd;
    var eventStart = event.start;
    var eventEnd = event.end || event.start;
    if (eventStart > periodStart && eventStart < periodEnd) {
        return true;
    }
    if (eventEnd > periodStart && eventEnd < periodEnd) {
        return true;
    }
    if (eventStart < periodStart && eventEnd > periodEnd) {
        return true;
    }
    if (isSameSecond(eventStart, periodStart) || isSameSecond(eventStart, periodEnd)) {
        return true;
    }
    if (isSameSecond(eventEnd, periodStart) || isSameSecond(eventEnd, periodEnd)) {
        return true;
    }
    return false;
}
function getEventsInPeriod(_a) {
    var events = _a.events, periodStart = _a.periodStart, periodEnd = _a.periodEnd;
    return events.filter(function (event) { return isEventIsPeriod({ event: event, periodStart: periodStart, periodEnd: periodEnd }); });
}
function getWeekDay(_a) {
    var date = _a.date;
    var today = startOfDay(new Date());
    return {
        date: date,
        isPast: date < today,
        isToday: isSameDay(date, today),
        isFuture: date > today,
        isWeekend: WEEKEND_DAY_NUMBERS.indexOf(getDay(date)) > -1
    };
}
export function getWeekViewHeader(_a) {
    var viewDate = _a.viewDate, weekStartsOn = _a.weekStartsOn, _b = _a.excluded, excluded = _b === void 0 ? [] : _b, _c = _a.weekViewDays, weekViewDays = _c === void 0 ? DAYS_IN_WEEK : _c;
    var start = startOfWeek(viewDate, { weekStartsOn: weekStartsOn });
    var days = [];
    var _loop_1 = function (i) {
        var date = addDays(start, i);
        if (!excluded.some(function (e) { return date.getDay() === e; })) {
            days.push(getWeekDay({ date: date }));
        }
    };
    for (var i = 0; i < weekViewDays; i++) {
        _loop_1(i);
    }
    return days;
}
export function getWeekView(_a) {
    var _b = _a.events, events = _b === void 0 ? [] : _b, viewDate = _a.viewDate, weekStartsOn = _a.weekStartsOn, _c = _a.excluded, excluded = _c === void 0 ? [] : _c, _d = _a.weekViewDays, weekViewDays = _d === void 0 ? DAYS_IN_WEEK : _d;
    if (!events) {
        events = [];
    }
    var startOfViewWeek = startOfWeek(viewDate, { weekStartsOn: weekStartsOn });
    var endOfViewWeek = endOfWeek(viewDate, { weekStartsOn: weekStartsOn });
    var maxRange = weekViewDays - excluded.length;
    var eventsMapped = getEventsInPeriod({ events: events, periodStart: startOfViewWeek, periodEnd: endOfViewWeek }).map(function (event) {
        var offset = getWeekViewEventOffset({ event: event, startOfWeek: startOfViewWeek, excluded: excluded });
        var span = getWeekViewEventSpan({ event: event, offset: offset, startOfWeek: startOfViewWeek, excluded: excluded });
        return { event: event, offset: offset, span: span };
    }).filter(function (e) { return e.offset < maxRange; }).filter(function (e) { return e.span > 0; }).map(function (entry) { return ({
        event: entry.event,
        offset: entry.offset,
        span: entry.span,
        startsBeforeWeek: entry.event.start < startOfViewWeek,
        endsAfterWeek: (entry.event.end || entry.event.start) > endOfViewWeek
    }); }).sort(function (itemA, itemB) {
        var startSecondsDiff = differenceInSeconds(itemA.event.start, itemB.event.start);
        if (startSecondsDiff === 0) {
            return differenceInSeconds(itemB.event.end || itemB.event.start, itemA.event.end || itemA.event.start);
        }
        return startSecondsDiff;
    });
    var eventRows = [];
    var allocatedEvents = [];
    eventsMapped.forEach(function (event, index) {
        if (allocatedEvents.indexOf(event) === -1) {
            allocatedEvents.push(event);
            var rowSpan_1 = event.span + event.offset;
            var otherRowEvents = eventsMapped.slice(index + 1).filter(function (nextEvent) {
                if (nextEvent.offset >= rowSpan_1 &&
                    rowSpan_1 + nextEvent.span <= weekViewDays &&
                    allocatedEvents.indexOf(nextEvent) === -1) {
                    nextEvent.offset -= rowSpan_1;
                    rowSpan_1 += nextEvent.span + nextEvent.offset;
                    allocatedEvents.push(nextEvent);
                    return true;
                }
            });
            eventRows.push({
                row: [
                    event
                ].concat(otherRowEvents)
            });
        }
    });
    return eventRows;
}
export function getMonthView(_a) {
    var _b = _a.events, events = _b === void 0 ? [] : _b, viewDate = _a.viewDate, weekStartsOn = _a.weekStartsOn, _c = _a.excluded, excluded = _c === void 0 ? [] : _c;
    if (!events) {
        events = [];
    }
    var start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: weekStartsOn });
    var end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: weekStartsOn });
    var eventsInMonth = getEventsInPeriod({
        events: events,
        periodStart: start,
        periodEnd: end
    });
    var days = [];
    var _loop_2 = function (i) {
        var date = addDays(start, i);
        if (!excluded.some(function (e) { return date.getDay() === e; })) {
            var day = getWeekDay({ date: date });
            var events_1 = getEventsInPeriod({
                events: eventsInMonth,
                periodStart: startOfDay(date),
                periodEnd: endOfDay(date)
            });
            day.inMonth = isSameMonth(date, viewDate);
            day.events = events_1;
            day.badgeTotal = events_1.length;
            days.push(day);
        }
    };
    for (var i = 0; i < differenceInDays(end, start) + 1; i++) {
        _loop_2(i);
    }
    var totalDaysVisibleInWeek = DAYS_IN_WEEK - excluded.length;
    var rows = Math.floor(days.length / totalDaysVisibleInWeek);
    var rowOffsets = [];
    for (var i = 0; i < rows; i++) {
        rowOffsets.push(i * totalDaysVisibleInWeek);
    }
    return {
        rowOffsets: rowOffsets,
        totalDaysVisibleInWeek: totalDaysVisibleInWeek,
        days: days
    };
}
export function getDayView(_a) {
    var _b = _a.events, events = _b === void 0 ? [] : _b, viewDate = _a.viewDate, hourSegments = _a.hourSegments, dayStart = _a.dayStart, dayEnd = _a.dayEnd, eventWidth = _a.eventWidth, segmentHeight = _a.segmentHeight;
    if (!events) {
        events = [];
    }
    var startOfView = setMinutes(setHours(startOfDay(viewDate), dayStart.hour), dayStart.minute);
    var endOfView = setMinutes(setHours(startOfMinute(endOfDay(viewDate)), dayEnd.hour), dayEnd.minute);
    var previousDayEvents = [];
    var dayViewEvents = getEventsInPeriod({
        events: events.filter(function (event) { return !event.allDay; }),
        periodStart: startOfView,
        periodEnd: endOfView
    }).sort(function (eventA, eventB) {
        return eventA.start.valueOf() - eventB.start.valueOf();
    }).map(function (event) {
        var eventStart = event.start;
        var eventEnd = event.end || eventStart;
        var startsBeforeDay = eventStart < startOfView;
        var endsAfterDay = eventEnd > endOfView;
        var hourHeightModifier = (hourSegments * segmentHeight) / MINUTES_IN_HOUR;
        var top = 0;
        if (eventStart > startOfView) {
            top += differenceInMinutes(eventStart, startOfView);
        }
        top *= hourHeightModifier;
        var startDate = startsBeforeDay ? startOfView : eventStart;
        var endDate = endsAfterDay ? endOfView : eventEnd;
        var height = differenceInMinutes(endDate, startDate);
        if (!event.end) {
            height = segmentHeight;
        }
        else {
            height *= hourHeightModifier;
        }
        var bottom = top + height;
        var overlappingPreviousEvents = previousDayEvents.filter(function (previousEvent) {
            var previousEventTop = previousEvent.top;
            var previousEventBottom = previousEvent.top + previousEvent.height;
            if (top < previousEventBottom && previousEventBottom < bottom) {
                return true;
            }
            else if (previousEventTop <= top && bottom <= previousEventBottom) {
                return true;
            }
            return false;
        });
        var left = 0;
        while (overlappingPreviousEvents.some(function (previousEvent) { return previousEvent.left === left; })) {
            left += eventWidth;
        }
        var dayEvent = {
            event: event,
            height: height,
            width: eventWidth,
            top: top,
            left: left,
            startsBeforeDay: startsBeforeDay,
            endsAfterDay: endsAfterDay
        };
        if (height > 0) {
            previousDayEvents.push(dayEvent);
        }
        return dayEvent;
    }).filter(function (dayEvent) { return dayEvent.height > 0; });
    var width = Math.max.apply(Math, dayViewEvents.map(function (event) { return event.left + event.width; }));
    var allDayEvents = getEventsInPeriod({
        events: events.filter(function (event) { return event.allDay; }),
        periodStart: startOfDay(startOfView),
        periodEnd: endOfDay(endOfView)
    });
    return {
        events: dayViewEvents,
        width: width,
        allDayEvents: allDayEvents
    };
}
export function getDayViewHourGrid(_a) {
    var viewDate = _a.viewDate, hourSegments = _a.hourSegments, dayStart = _a.dayStart, dayEnd = _a.dayEnd;
    var hours = [];
    var startOfView = setMinutes(setHours(startOfDay(viewDate), dayStart.hour), dayStart.minute);
    var endOfView = setMinutes(setHours(startOfMinute(endOfDay(viewDate)), dayEnd.hour), dayEnd.minute);
    var segmentDuration = MINUTES_IN_HOUR / hourSegments;
    var startOfViewDay = startOfDay(viewDate);
    for (var i = 0; i < HOURS_IN_DAY; i++) {
        var segments = [];
        for (var j = 0; j < hourSegments; j++) {
            var date = addMinutes(addHours(startOfViewDay, i), j * segmentDuration);
            if (date >= startOfView && date < endOfView) {
                segments.push({
                    date: date,
                    isStart: j === 0
                });
            }
        }
        if (segments.length > 0) {
            hours.push({ segments: segments });
        }
    }
    return hours;
}
//# sourceMappingURL=calendarUtils.js.map