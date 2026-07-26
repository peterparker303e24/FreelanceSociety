import {
    overrideInputToIntegerRange,
    pad2Digits
} from "../../utils/commonFunctions.js";

/**
 * Reusable section for user to input deadline by timespan or date and time
 */
export class SetDeadlineSection extends HTMLElement {

    /**
     * @type {ShadowRoot | null} Shadow root element for this component
     */
    #shadowRootElement = null;
    
    /**
     * @type {HTMLElement | null} Timespan years input, either blank or from
     * -MAX_NUM to MAX_NUM
     */
    #timespanFieldYears = null;
    
    /**
     * @type {HTMLElement | null} Timespan months input, either blank or from
     * -MAX_NUM to MAX_NUM
     */
    #timespanFieldMonths = null;
    
    /**
     * @type {HTMLElement | null} Timespan days input, either blank or from
     * -MAX_NUM to MAX_NUM
     */
    #timespanFieldDays = null;
    
    /**
     * @type {HTMLElement | null} Timespan hours input, either blank or from
     * -MAX_NUM to MAX_NUM
     */
    #timespanFieldHours = null;
    
    /**
     * @type {HTMLElement | null} Timespan minutes input, either blank or from
     * -MAX_NUM to MAX_NUM
     */
    #timespanFieldMinutes = null;
    
    /**
     * @type {HTMLElement | null} Timespan seconds input, either blank or from
     * -MAX_NUM to MAX_NUM
     */
    #timespanFieldSeconds = null;
    
    /**
     * @type {HTMLElement | null} Date time year input
     */
    #dateTimeFieldYear = null;
    
    /**
     * @type {HTMLElement | null} Date time month option select
     */
    #dateTimeFieldMonthSelect = null;
    
    /**
     * @type {HTMLElement | null} Date time day input, from 1 to 31
     */
    #dateTimeFieldDay = null;
    
    /**
     * @type {HTMLElement | null} Date time hour input, UTC 24 hour time
     */
    #dateTimeFieldHour = null;
    
    /**
     * @type {HTMLElement | null} Date time minute input, UTC 24 hour time
     */
    #dateTimeFieldMinute = null;
    
    /**
     * @type {HTMLElement | null} Date time second input, UTC 24 hour time
     */
    #dateTimeFieldSecond = null;
    
    /**
     * @type {HTMLElement | null} Repeat timespan text for clarity
     */
    #deadlineTimespan = null;
    
    /**
     * @type {HTMLElement | null} Repeat date time text for clarity
     */
    #deadlineDateTime = null;
    
    /**
     * @type {HTMLElement | null} Deadline error text
     */
    #deadlineError = null;
    
    /**
     * @type {Set<Function>} Set of subscribers to notify when the deadline has
     * been updated
     */
    #subscribers = new Set();

    /**
     * @type {DeadlineError} Type of error in the current deadline
     */
    #errorType = "NONE";
    
    /**
     * @type {Boolean} Use the timespan entry over the date time entry, the
     * entry type is also static while the other entry type is synced to the
     * static deadline entry
     */
    #useTimespanOverDateTime = true;

    /**
     * @type {Date | null} Deadline date time value
     */
    #deadlineDateTimeValue = null;

    /**
     * @type {Number | null} Deadline timespan years value, must be a positive
     * or integer number from -MAX_NUM to MAX_
     */
    #deadlineTimespanYears = 0;
    
    /**
     * @type {Number | null} Deadline timespan months value, must be a positive
     * or integer number from -MAX_NUM to MAX_
     */
    #deadlineTimespanMonths = 0;
    
    /**
     * @type {Number | null} Deadline timespan days value, must be a positive or
     * integer number from -MAX_NUM to MAX_
     */
    #deadlineTimespanDays = 0;
    
    /**
     * @type {Number | null} Deadline timespan hours value, must be a positive
     * or integer number from -MAX_NUM to MAX_
     */
    #deadlineTimespanHours = 0;
    
    /**
     * @type {Number | null} Deadline timespan minutes value, must be a positive
     * or integer number from -MAX_NUM to MAX_
     */
    #deadlineTimespanMinutes = 0;
    
    /**
     * @type {Number | null} Deadline timespan seconds value, must be a positive
     * or integer number from -MAX_NUM to MAX_NUM
     */
    #deadlineTimespanSeconds = 0;
    
    /**
     * @type {Number | null} Deadline second counting interval ID
     */
    #deadlineTickerInterval = null;
    
    /**
     * @type {Number | null} Deadline date time years value, must be a positive
     * integer
     */
    #deadlineDateTimeYear = null;
    
    /**
     * @type {MonthName | null} Deadline date time month name
     */
    #deadlineDateTimeMonth = null;
    
    /**
     * @type {Number | null} Deadline date time years value, must be a positive
     * integer from 1 to 31
     */
    #deadlineDateTimeDay = null;
    
    /**
     * @type {Number | null} Deadline date time years value, must be a
     * non-negative integer from 0 to 23
     */
    #deadlineDateTimeHour = null;
    
    /**
     * @type {Number | null} Deadline date time years value, must be a
     * non-negative integer from 0 to 59
     */
    #deadlineDateTimeMinute = null;
    
    /**
     * @type {Number | null} Deadline date time seconds value, must be a
     * non-negative integer from 0 to 59
     */
    #deadlineDateTimeSecond = null;
    
    /**
     * @type {DayOfWeekName} Day of the week name for the deadline
     */
    #deadlineDateTimeDayOfWeek = null;

    /**
     * @typedef {(
     *     "NONE"
     *     | "PAST"
     *     | "INVALID"
     * )} DeadlineError Type of error for the deadline component.
     * "NONE" - No error in user input,
     * "PAST" - Deadline is in the past,
     * "INVALID" - An invalid or incomplete user input error
     */

    /**
     * @typedef {(
     *     "Monday"
     *     | "Tuesday"
     *     | "Wednesday"
     *     | "Thursday"
     *     | "Friday"
     *     | "Saturday"
     *     | "Sunday"
     * )} DayOfWeekName Day of week name
     */

    /**
     * @typedef {(
     *     | "January"
     *     | "February"
     *     | "March"
     *     | "April"
     *     | "May"
     *     | "June"
     *     | "July"
     *     | "August"
     *     | "September"
     *     | "October"
     *     | "November"
     *     | "December"
     * )} MonthName Month name
     */

    /**
     * @typedef {Object} DateTimeInfo 
     * @param {Number} year 
     * @param {MonthName} monthName 
     * @param {Number} day 
     * @param {DayOfWeekName} dayOfWeek 
     * @param {String} hour 
     * @param {String} minute 
     * @param {String} second 
     */

    /**
     * @typedef {Object} TimespanInfo 
     * @param {Number} years 
     * @param {Number} months 
     * @param {Number} days 
     * @param {Number} hours 
     * @param {Number} minutes 
     * @param {Number} seconds 
     */

    /**
     * Initialize component shadow root HTML, set class variables for HTML
     * elements, and initialize the deadline by timespan
     */
    constructor() {
        super();
        this.#shadowRootElement = this.attachShadow({ mode: "open" });
        this.#shadowRootElement.innerHTML = `
            <link rel="stylesheet" href="./global.css">
            <div class="deadline-container">
                <div class="deadline-description medium-text">Input task deadline by timespan or by setting the deadline date and time</div>
                <br>

                <!-- Set deadline by timespan in years, months, days, hours, minutes, seconds -->
                <h3 class="timespan__subheader">Set Deadline By Timespan</h3>
                <fieldset class="timespan__fieldset">
                    <div class="timespan__container small-padding row-left flex-wrap">
                        <div class="timespan__years-container row vertically-center-row">
                            <label class="timespan__years-label large-width small-margin-right right-align">Years</label>
                            <input class="timespan__years-input input-line small-margin-vertical large-margin-right large-width small-padding-horizontal" id="years" value="0">
                        </div>
                        <div class="timespan__months-container row vertically-center-row">
                            <label class="timespan__months-label large-width small-margin-right right-align">Months</label>
                            <input class="timespan__months-input input-line small-margin-vertical large-margin-right large-width small-padding-horizontal" id="months" value="0">
                        </div>
                        <div class="timespan__days-container row vertically-center-row">
                            <label class="timespan__days-label large-width small-margin-right right-align">Days</label>
                            <input class="timespan__days-input input-line small-margin-vertical large-margin-right large-width small-padding-horizontal" id="days" value="0">
                        </div>
                        <div class="timespan__hours-container row vertically-center-row">
                            <label class="timespan__hours-label large-width small-margin-right right-align">Hours</label>
                            <input class="timespan__hours-input input-line small-margin-vertical large-margin-right large-width small-padding-horizontal" id="hours" value="0">
                        </div>
                        <div class="timespan__minutes-container row vertically-center-row">
                            <label class="timespan__minutes-label large-width small-margin-right right-align">Minutes</label>
                            <input class="timespan__minutes-input input-line small-margin-vertical large-margin-right large-width small-padding-horizontal" id="minutes" value="0">
                        </div>
                        <div class="timespan__seconds-container row vertically-center-row">
                            <label class="timespan__seconds-label large-width small-margin-right right-align">Seconds</label>
                            <input class="timespan__seconds-input input-line small-margin-vertical large-margin-right large-width small-padding-horizontal" id="seconds" value="0">
                        </div>
                    </div>
                </fieldset>
                <br>

                <!-- Set the deadline by the exact date and time in the future -->
                <h3 class="date-time__subheader">Set Deadline By Date And Time</h3>
                <fieldset class="date-time__fieldset">
                    <div class="date-time__container small-padding row-left flex-wrap">
                        <div class="date-time__year-container row vertically-center-row">
                            <label class="date-time__year-label large-width small-margin-right right-align">Year</label>
                            <input class="date-time__year-input input-line small-margin-vertical large-margin-right large-width small-padding-horizontal" value="">
                        </div>
                        <div class="date-time__month-container row vertically-center-row">
                            <label class="date-time__month-label large-width small-margin-right right-align">Month</label>
                            <select class="date-time__month-select small-padding large-margin-right">
                                <option class="date-time__month-none" value="none" selected>-</option>
                                <option class="date-time__month-january" value="january">January</option>
                                <option class="date-time__month-february" value="february">February</option>
                                <option class="date-time__month-march" value="march">March</option>
                                <option class="date-time__month-april" value="april">April</option>
                                <option class="date-time__month-may" value="may">May</option>
                                <option class="date-time__month-june" value="june">June</option>
                                <option class="date-time__month-july" value="july">July</option>
                                <option class="date-time__month-august" value="august">August</option>
                                <option class="date-time__month-september" value="september">September</option>
                                <option class="date-time__month-october" value="october">October</option>
                                <option class="date-time__month-november" value="november">November</option>
                                <option class="date-time__month-december" value="december">December</option>
                            </select>
                        </div>
                        <div class="date-time__day-container row vertically-center-row">
                            <label class="date-time__day-label large-width small-margin-right right-align">Day</label>
                            <input class="date-time__day-input input-line small-margin-vertical large-margin-right large-width small-padding-horizontal" value="">
                        </div>
                        <div class="date-time__time-container row vertically-center-row">
                            <label class="date-time__time-label large-width small-margin-right right-align">Time</label>
                            <input class="date-time__hour-input input-line small-margin-vertical large-width small-padding-horizontal" value="">
                            <div class="date-time__hour-minute-colon">:</div>
                            <input class="date-time__minute-input input-line small-margin-vertical large-width small-padding-horizontal" value="">
                            <div class="date-time__hour-minute-colon">:</div>
                            <input class="date-time__second-input input-line small-margin-vertical large-width small-padding-horizontal" value="">
                        </div>
                    </div>
                </fieldset>
            </div>
            <br>

            <!-- Repeat deadline timespan and date/time for clarity -->
            <div class="deadline-timespan-confirmation-container row-left">
                <div class="deadline-timespan-confirmation">Deadline Timespan:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-</div>
            </div>
            <div class="deadline-date-time-confirmation-container row-left">
                <div class="deadline-date-time-confirmation">Deadline Date and Time (UTC): -</div>
            </div>
            <br>
            <div class="deadline-error-container row-left">
                <div class="deadline-error"></div>
            </div>
        `;
        this.#timespanFieldYears = this.#shadowRootElement.querySelector(
            '.timespan__years-input'
        );
        this.#timespanFieldMonths = this.#shadowRootElement.querySelector(
            '.timespan__months-input'
        );
        this.#timespanFieldDays = this.#shadowRootElement.querySelector(
            '.timespan__days-input'
        );
        this.#timespanFieldHours = this.#shadowRootElement.querySelector(
            '.timespan__hours-input'
        );
        this.#timespanFieldMinutes = this.#shadowRootElement.querySelector(
            '.timespan__minutes-input'
        );
        this.#timespanFieldSeconds = this.#shadowRootElement.querySelector(
            '.timespan__seconds-input'
        );
        this.#dateTimeFieldYear = this.#shadowRootElement.querySelector(
            '.date-time__year-input'
        );
        this.#dateTimeFieldMonthSelect = this.#shadowRootElement.querySelector(
            '.date-time__month-select'
        );
        this.#dateTimeFieldDay = this.#shadowRootElement.querySelector(
            '.date-time__day-input'
        );
        this.#dateTimeFieldHour = this.#shadowRootElement.querySelector(
            '.date-time__hour-input'
        );
        this.#dateTimeFieldMinute = this.#shadowRootElement.querySelector(
            '.date-time__minute-input'
        );
        this.#dateTimeFieldSecond = this.#shadowRootElement.querySelector(
            '.date-time__second-input'
        );
        this.#deadlineTimespan = this.#shadowRootElement.querySelector(
            '.deadline-timespan-confirmation'
        );
        this.#deadlineDateTime = this.#shadowRootElement.querySelector(
            '.deadline-date-time-confirmation'
        );
        this.#deadlineError = this.#shadowRootElement.querySelector(
            '.deadline-error'
        );
        this.#updateDeadlineByTimespan();
    }
    
    /**
     * This lifecycle method is called when the element is inserted into the
     * DOM. Bind input and select event listeners to their functions.
     */
    connectedCallback() {
        this.#timespanFieldYears.addEventListener(
            "input",
            this.#updateDeadlineByTimespan.bind(this)
        );
        this.#timespanFieldMonths.addEventListener(
            "input",
            this.#updateDeadlineByTimespan.bind(this)
        );
        this.#timespanFieldDays.addEventListener(
            "input",
            this.#updateDeadlineByTimespan.bind(this)
        );
        this.#timespanFieldHours.addEventListener(
            "input",
            this.#updateDeadlineByTimespan.bind(this)
        );
        this.#timespanFieldMinutes.addEventListener(
            "input",
            this.#updateDeadlineByTimespan.bind(this)
        );
        this.#timespanFieldSeconds.addEventListener(
            "input",
            this.#updateDeadlineByTimespan.bind(this)
        );
        this.#dateTimeFieldYear.addEventListener(
            "input",
            this.#updateDeadlineByDateTime.bind(this)
        );
        this.#dateTimeFieldMonthSelect.addEventListener(
            "change",
            this.#updateDeadlineByDateTime.bind(this)
        );
        this.#dateTimeFieldDay.addEventListener(
            "input",
            this.#updateDeadlineByDateTime.bind(this)
        );
        this.#dateTimeFieldHour.addEventListener(
            "input",
            this.#updateDeadlineByDateTime.bind(this)
        );
        this.#dateTimeFieldMinute.addEventListener(
            "input",
            this.#updateDeadlineByDateTime.bind(this)
        );
        this.#dateTimeFieldSecond.addEventListener(
            "input",
            this.#updateDeadlineByDateTime.bind(this)
        );
    }

    /**
     * Adds the given function to the deadline update subscribers set
     * @param {Function} updateDeadlineCallback Callback function notified when
     * deadline has been updated
     * @returns {SetDeadlineSection} Returns this set deadline section object
     * for builder pattern
     */
    subscribeToDeadlineUpdate(updateDeadlineCallback) {
        this.#subscribers.add(updateDeadlineCallback);
        return this;
    }

    /**
     * Unsubscribes the given function from the data found notification
     * @param {Function} dataFoundCallback Function to delete from set of
     * subscribers
     */
    unsubscribeToDeadlineUpdate(dataFoundCallback) {
        this.#subscribers.delete(dataFoundCallback);
    }

    /**
     * Notifies all subscribers with the updated deadline
     */
    #notifyDeadlineUpdate() {

        // Initialize deadline to null
        this.#deadlineDateTimeValue = null;

        // Calculate the deadline if timespan it used, otherwise use date time
        // values
        if (this.#useTimespanOverDateTime) {
            const calculatedDateTime
                = this.#calculateDateTimeFromTimespanFromNow(
                    this.#deadlineTimespanYears,
                    this.#deadlineTimespanMonths,
                    this.#deadlineTimespanDays,
                    this.#deadlineTimespanHours,
                    this.#deadlineTimespanMinutes,
                    this.#deadlineTimespanSeconds
                );

            // Validate the date time, notify subscribers with null deadline if
            // invalid
            if (
                calculatedDateTime.year !== null
                && calculatedDateTime.monthName !== null
                && this.#getMonthIndex(calculatedDateTime.monthName) !== -1
                && calculatedDateTime.day !== null
                && calculatedDateTime.hour !== null
                && calculatedDateTime.minute !== null
                && calculatedDateTime.second !== null
            ) {
                this.#deadlineDateTimeValue = new Date(
                    calculatedDateTime.year,
                    this.#getMonthIndex(calculatedDateTime.monthName),
                    calculatedDateTime.day,
                    calculatedDateTime.hour,
                    calculatedDateTime.minute,
                    calculatedDateTime.second
                );
            }
        } else {

            // Validate the date time, notify subscribers with null deadline if
            // invalid
            if (
                this.#deadlineDateTimeYear !== null
                && this.#deadlineDateTimeMonth !== null
                && this.#getMonthIndex(this.#deadlineDateTimeMonth) !== -1
                && this.#deadlineDateTimeDay !== null
                && this.#deadlineDateTimeHour !== null
                && this.#deadlineDateTimeMinute !== null
                && this.#deadlineDateTimeSecond !== null
            ) {
                this.#deadlineDateTimeValue = new Date(
                    this.#deadlineDateTimeYear,
                    this.#getMonthIndex(this.#deadlineDateTimeMonth),
                    this.#deadlineDateTimeDay,
                    this.#deadlineDateTimeHour,
                    this.#deadlineDateTimeMinute,
                    this.#deadlineDateTimeSecond
                );
            }
        }

        // Notify all subscribers with the deadline date time or null if invalid
        for (const callback of this.#subscribers) {
            callback(this.#deadlineDateTimeValue);
        }
    }

    /**
     * Gets the type of deadline error, if any
     * @returns {DeadlineError} Type of deadline error
     */
    getDeadlineError() {
        return this.#errorType;
    }

    /**
     * Update deadline value by timespan value, update timespan and date time
     * displays, and validate deadline errors
     */
    #updateDeadlineByTimespan() {

        // Update entry type to timespan and initialize error to none
        this.#useTimespanOverDateTime = true;
        this.#deadlineError.textContent = "";
        this.#errorType = "NONE";

        // Override timespan input values from -MAX_NUM to MAX_NUM
        const MAX_NUM = 100_000;
        this.#deadlineTimespanYears = overrideInputToIntegerRange(
            this.#timespanFieldYears,
            -MAX_NUM,
            MAX_NUM
        );
        this.#deadlineTimespanMonths = overrideInputToIntegerRange(
            this.#timespanFieldMonths,
            -MAX_NUM,
            MAX_NUM
        );
        this.#deadlineTimespanDays = overrideInputToIntegerRange(
            this.#timespanFieldDays,
            -MAX_NUM,
            MAX_NUM
        );
        this.#deadlineTimespanHours = overrideInputToIntegerRange(
            this.#timespanFieldHours,
            -MAX_NUM,
            MAX_NUM
        );
        this.#deadlineTimespanMinutes = overrideInputToIntegerRange(
            this.#timespanFieldMinutes,
            -MAX_NUM,
            MAX_NUM
        );
        this.#deadlineTimespanSeconds = overrideInputToIntegerRange(
            this.#timespanFieldSeconds,
            -MAX_NUM,
            MAX_NUM
        );

        // Update the timespan and date time displays
        this.#setTimespanText(
            this.#deadlineTimespanYears,
            this.#deadlineTimespanMonths,
            this.#deadlineTimespanDays,
            this.#deadlineTimespanHours,
            this.#deadlineTimespanMinutes,
            this.#deadlineTimespanSeconds
        );
        this.#setDateTimeDisplayFromTimespan();

        // Notify subscribers of new date time
        this.#notifyDeadlineUpdate();

        // Clear any timespan or date time interval
        if (this.#deadlineTickerInterval !== null) {
            clearInterval(this.#deadlineTickerInterval);
        }

        // Validate all timespan fields and exit early if any invalid
        const anyNullFields
            = this.#deadlineTimespanYears === null
            || this.#deadlineTimespanMonths === null
            || this.#deadlineTimespanDays === null
            || this.#deadlineTimespanHours === null
            || this.#deadlineTimespanMinutes === null
            || this.#deadlineTimespanSeconds === null;
        if (anyNullFields) {
            return;
        }
        
        // Validate the deadline is in the future
        const {
            year: calculatedDateYear,
            monthName: calculatedDateMonth,
            day: calculatedDateDay,
            hour: calculatedDateHour,
            minute: calculatedDateMinute,
            second: calculatedDateSecond
        } = this.#calculateDateTimeFromTimespanFromNow(
            this.#deadlineTimespanYears,
            this.#deadlineTimespanMonths,
            this.#deadlineTimespanDays,
            this.#deadlineTimespanHours,
            this.#deadlineTimespanMinutes,
            this.#deadlineTimespanSeconds
        );
        const calculatedDeadlineDateTime = new Date();
        calculatedDeadlineDateTime.setFullYear(calculatedDateYear);
        calculatedDeadlineDateTime.setMonth(
            this.#getMonthIndex(calculatedDateMonth)
        );
        calculatedDeadlineDateTime.setDate(calculatedDateDay);
        calculatedDeadlineDateTime.setHours(calculatedDateHour);
        calculatedDeadlineDateTime.setMinutes(calculatedDateMinute);
        calculatedDeadlineDateTime.setSeconds(calculatedDateSecond);
        calculatedDeadlineDateTime.setMilliseconds(0);
        if (calculatedDeadlineDateTime < new Date()) {
            this.#deadlineError.textContent
                = "[X] ERROR: Deadline must be in the future";
            this.#errorType = "PAST";
        }

        // Create a 1 second interval to update the date time display and notify
        // subscribers of new date time deadline
        this.#deadlineTickerInterval = setInterval(() => {
            this.#setDateTimeDisplayFromTimespan();
            this.#notifyDeadlineUpdate();
        }, 1_000);
    }

    /**
     * Update deadline value by date time value, update timespan and date time
     * displays, and validate deadline errors
     */
    #updateDeadlineByDateTime() {

        // Update entry type to date time and initialize error to none
        this.#useTimespanOverDateTime = false;
        this.#deadlineError.textContent = "";
        this.#errorType = "NONE";

        // Override date time input values to acceptable range
        this.#deadlineDateTimeYear = overrideInputToIntegerRange(
            this.#dateTimeFieldYear,
            0,
            69_420
        );
        if (this.#deadlineDateTimeMonth === "none") {
            this.#deadlineDateTimeMonth = null;
        } else {
            this.#deadlineDateTimeMonth = this.#getMonthName(
                this.#getMonthIndex(
                    this.#dateTimeFieldMonthSelect.value
                )
            );
        }
        this.#deadlineDateTimeDay = overrideInputToIntegerRange(
            this.#dateTimeFieldDay,
            1,
            31);
            this
            .#deadlineDateTimeHour = overrideInputToIntegerRange(
            this.#dateTimeFieldHour,
            0,
            23,
            true
        );
        this.#deadlineDateTimeMinute = overrideInputToIntegerRange(
            this.#dateTimeFieldMinute,
            0,
            59,
            true
        );
        this.#deadlineDateTimeSecond = overrideInputToIntegerRange(
            this.#dateTimeFieldSecond,
            0,
            59,
            true
        );

        // Validate all date time fields
        const anyNullFields
            = this.#deadlineDateTimeYear === null
            || this.#deadlineDateTimeMonth === null
            || this.#deadlineDateTimeDay === null
            || this.#deadlineDateTimeHour === null
            || this.#deadlineDateTimeMinute === null
            || this.#deadlineDateTimeSecond === null;

        // Calculate the day of the week name and month name 
        let dayOfWeekName = null;
        let monthName = null;
        const calculatedDeadlineDateTime = new Date();
        if (!anyNullFields) {
            calculatedDeadlineDateTime.setFullYear(this.#deadlineDateTimeYear);
            calculatedDeadlineDateTime.setMonth(
                this.#getMonthIndex(this.#deadlineDateTimeMonth)
            );
            calculatedDeadlineDateTime.setDate(this.#deadlineDateTimeDay);
            calculatedDeadlineDateTime.setHours(this.#deadlineDateTimeHour);
            calculatedDeadlineDateTime.setMinutes(this.#deadlineDateTimeMinute);
            calculatedDeadlineDateTime.setSeconds(this.#deadlineDateTimeSecond);
            calculatedDeadlineDateTime.setMilliseconds(0);
            dayOfWeekName = this.#getDayName(
                calculatedDeadlineDateTime.getDay()
            );
            if (this.#deadlineDateTimeMonth !== null) {
                monthName = this.#deadlineDateTimeMonth;
            }
        }

        // Update the date time and timespan displays
        this.#setDateTimeText(
            this.#deadlineDateTimeYear,
            monthName,
            this.#deadlineDateTimeDay,
            dayOfWeekName,
            this.#deadlineDateTimeHour,
            this.#deadlineDateTimeMinute,
            this.#deadlineDateTimeSecond
        );
        this.#setTimespanDisplayFromDateTime();

        // Notify subscribers of new date time
        this.#notifyDeadlineUpdate();

        // Clear any timespan or date time interval
        if (this.#deadlineTickerInterval !== null) {
            clearInterval(this.#deadlineTickerInterval);
        }

        // Exit early if any date time fields are invalid
        if (anyNullFields) {
            return;
        }

        // Validate the deadline is in the future
        if (calculatedDeadlineDateTime < new Date()) {
            this.#deadlineError.textContent
                = "[X] ERROR: Deadline must be in the future";
            this.#errorType = "PAST";
        }

        // Create a 1 second interval to update the timespan display
        this.#deadlineTickerInterval = setInterval(() => {
            this.#setTimespanDisplayFromDateTime();
        }, 1_000);
    }

    /**
     * Updates the deadline date time values and date time display using the
     * timespan variables
     */
    #setDateTimeDisplayFromTimespan() {

        // Update the deadline date time variables if all timespan variables are
        // valid, otherwise just update the date time display to default
        if (this.#deadlineTimespanYears !== null
            && this.#deadlineTimespanMonths !== null
            && this.#deadlineTimespanDays !== null
            && this.#deadlineTimespanHours !== null
            && this.#deadlineTimespanMinutes !== null
            && this.#deadlineTimespanSeconds !== null
        ) {
            ({
                year: this.#deadlineDateTimeYear,
                monthName: this.#deadlineDateTimeMonth,
                day: this.#deadlineDateTimeDay,
                dayOfWeek: this.#deadlineDateTimeDayOfWeek,
                hour: this.#deadlineDateTimeHour,
                minute: this.#deadlineDateTimeMinute,
                second: this.#deadlineDateTimeSecond
            } = this.#calculateDateTimeFromTimespanFromNow(
                this.#deadlineTimespanYears,
                this.#deadlineTimespanMonths,
                this.#deadlineTimespanDays,
                this.#deadlineTimespanHours,
                this.#deadlineTimespanMinutes,
                this.#deadlineTimespanSeconds
            ));
            this.#setDateTimeText(
                this.#deadlineDateTimeYear,
                this.#deadlineDateTimeMonth,
                this.#deadlineDateTimeDay,
                this.#deadlineDateTimeDayOfWeek,
                this.#deadlineDateTimeHour,
                this.#deadlineDateTimeMinute,
                this.#deadlineDateTimeSecond
            );
        } else {
            this.#setDateTimeText(
                null,
                null,
                null,
                null,
                null,
                null,
                null
            );
        }

        // Update the date time inputs with the date time variables values
        this.#dateTimeFieldYear.value = this.#deadlineDateTimeYear ?? "";
        this.#dateTimeFieldMonthSelect.value
            = this.#deadlineDateTimeMonth?.toLowerCase() ?? "none";
        this.#dateTimeFieldDay.value = this.#deadlineDateTimeDay ?? "";
        this.#dateTimeFieldHour.value = this.#deadlineDateTimeHour
            ? pad2Digits(this.#deadlineDateTimeHour) : "";
        this.#dateTimeFieldMinute.value = this.#deadlineDateTimeMinute
            ? pad2Digits(this.#deadlineDateTimeMinute) : "";
        this.#dateTimeFieldSecond.value = this.#deadlineDateTimeSecond
            ? pad2Digits(this.#deadlineDateTimeSecond) : "";
    }

    /**
     * Updates the deadline timespan values and timespan display using the date
     * time variables
     */
    #setTimespanDisplayFromDateTime() {

        // Update the deadline timespan variables if all date time variables are
        // valid, otherwise just update the timespan display to default
        if (this.#deadlineDateTimeYear !== null
            && this.#deadlineDateTimeMonth !== null
            && this.#deadlineDateTimeDay !== null
            && this.#deadlineDateTimeHour !== null
            && this.#deadlineDateTimeMinute !== null
            && this.#deadlineDateTimeSecond !== null
        ) {
            ({
                years: this.#deadlineTimespanYears,
                months: this.#deadlineTimespanMonths,
                days: this.#deadlineTimespanDays,
                hours: this.#deadlineTimespanHours,
                minutes: this.#deadlineTimespanMinutes,
                seconds: this.#deadlineTimespanSeconds
            } = this.#calculateTimespanFromDateTimeFromNow(
                this.#deadlineDateTimeYear,
                this.#deadlineDateTimeMonth,
                this.#deadlineDateTimeDay,
                this.#deadlineDateTimeHour,
                this.#deadlineDateTimeMinute,
                this.#deadlineDateTimeSecond
            ));
            this.#setTimespanText(
                this.#deadlineTimespanYears,
                this.#deadlineTimespanMonths,
                this.#deadlineTimespanDays,
                this.#deadlineTimespanHours,
                this.#deadlineTimespanMinutes,
                this.#deadlineTimespanSeconds
            );
        } else {
            this.#setTimespanText(
                null,
                null,
                null,
                null,
                null,
                null
            );
        }

        // Update the timespan inputs with the date time variables values
        this.#timespanFieldYears.value = this.#deadlineTimespanYears;
        this.#timespanFieldMonths.value = this.#deadlineTimespanMonths;
        this.#timespanFieldDays.value = this.#deadlineTimespanDays;
        this.#timespanFieldHours.value = this.#deadlineTimespanHours;
        this.#timespanFieldMinutes.value = this.#deadlineTimespanMinutes;
        this.#timespanFieldSeconds.value = this.#deadlineTimespanSeconds;
    }

    /**
     * Calculates the date and time given the timespan from now
     * @param {Number} years Timespan years from now
     * @param {Number} months Timespan months from now
     * @param {Number} days Timespan days from now
     * @param {Number} hours Timespan hours from now
     * @param {Number} minutes Timespan minutes from now
     * @param {Number} seconds Timespan seconds from now
     * @returns {DateTimeInfo} The date and time information from now plus the
     * given timespan
     */
    #calculateDateTimeFromTimespanFromNow(
        years,
        months,
        days,
        hours,
        minutes,
        seconds
    ) {

        // Create a date time object using the time from now as the start, and
        // add each timespan increment
        const calculatedDeadlineDateTime = new Date();
        calculatedDeadlineDateTime.setFullYear(
            calculatedDeadlineDateTime.getFullYear() + years
        );
        calculatedDeadlineDateTime.setMonth(
            calculatedDeadlineDateTime.getMonth() + months
        );
        calculatedDeadlineDateTime.setDate(
            calculatedDeadlineDateTime.getDate() + days
        );
        calculatedDeadlineDateTime.setHours(
            calculatedDeadlineDateTime.getHours() + hours
        );
        calculatedDeadlineDateTime.setMinutes(
            calculatedDeadlineDateTime.getMinutes() + minutes
        );
        calculatedDeadlineDateTime.setSeconds(
            calculatedDeadlineDateTime.getSeconds() + seconds
        );

        // Get the month name and day of week name
        const calculatedDayOfWeek = this.#getDayName(
            calculatedDeadlineDateTime.getDay()
        );
        const calculatedMonthName = this.#getMonthName(
            calculatedDeadlineDateTime.getMonth()
        );

        // Return the date time information object
        return {
            year: calculatedDeadlineDateTime.getFullYear(),
            monthName: calculatedMonthName,
            day: calculatedDeadlineDateTime.getDate(),
            dayOfWeek: calculatedDayOfWeek,
            hour: pad2Digits(calculatedDeadlineDateTime.getHours()),
            minute: pad2Digits(calculatedDeadlineDateTime.getMinutes()),
            second: pad2Digits(calculatedDeadlineDateTime.getSeconds())
        };
    }
    
    /**
     * Calculates the from now given the date time
     * @param {Number} year Date time year
     * @param {MonthName} month Date time month name
     * @param {Number} day Date time day
     * @param {Number} hour Date time hour
     * @param {Number} minute Date time minute
     * @param {Number} second Date time second
     * @returns {TimespanInfo} The timespan information from now until the given
     * date time
     */
    #calculateTimespanFromDateTimeFromNow(
        year,
        month,
        day,
        hour,
        minute,
        second
    ) {

        // Constructs the date time of now and the given date time for
        // comparison
        const dateTimeNow = new Date();
        dateTimeNow.setMilliseconds(0);
        const dateTimeTarget = new Date();
        dateTimeTarget.setFullYear(year);
        dateTimeTarget.setMonth(this.#getMonthIndex(month));
        dateTimeTarget.setDate(day);
        dateTimeTarget.setHours(hour);
        dateTimeTarget.setMinutes(minute);
        dateTimeTarget.setSeconds(second);
        dateTimeTarget.setMilliseconds(0);

        // The timespan values to be calculated
        let years;
        let months;
        let days;
        let hours;
        let minutes;
        let seconds;

        // Calculates the difference in years between the dates, then updates
        // the years to match exactly to compare the rest of the timespan
        // values, and if the timespan year does not extend the full year
        // between the dates then decrement the year by 1
        years = dateTimeTarget.getFullYear() - dateTimeNow.getFullYear();
        dateTimeNow.setFullYear(dateTimeTarget.getFullYear());
        if (dateTimeNow > dateTimeTarget) {
            dateTimeNow.setFullYear(dateTimeTarget.getFullYear() - 1);
            years--;
        }

        // Calculates the difference in months between the dates, then updates
        // the months to match exactly to compare the rest of the timespan
        // values, and if the timespan month does not extend the full month
        // between the dates then decrement the month by 1
        const monthsDifference
            = dateTimeTarget.getMonth() - dateTimeNow.getMonth();
        months = (monthsDifference + 11) % 12 + 1;
        dateTimeNow.setFullYear(dateTimeTarget.getFullYear());
        dateTimeNow.setMonth(dateTimeTarget.getMonth());
        if (dateTimeNow > dateTimeTarget) {
            dateTimeNow.setMonth(dateTimeTarget.getMonth() - 1);
            months--;
        }

        // Calculate the exact number of seconds between the dates when the
        // year and month are matching
        const secondsLeftNoMonths = Math.floor(
            (dateTimeTarget.getTime() - dateTimeNow.getTime()) / 1_000
        );

        // Derive the days, leftover hours, leftover minutes, and leftover
        // seconds from the total seconds between the dates
        days = Math.floor(secondsLeftNoMonths / (24 * 60 * 60));
        const secondsLeftNoDays = secondsLeftNoMonths % (24 * 60 * 60);
        hours = Math.floor(secondsLeftNoDays / (60 * 60));
        const secondsLeftNoHours = secondsLeftNoDays % (60 * 60);
        minutes = Math.floor(secondsLeftNoHours / 60);
        seconds = secondsLeftNoHours % 60;

        // Return the timespan information object
        return {
            years: years,
            months: months,
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds
        };
    }

    /**
     * Set the timespan text with the given information, and set default value
     * if any data is invalid
     * @param {Number | null} years Number of years
     * @param {Number | null} months Number of months
     * @param {Number | null} days Number of days
     * @param {Number | null} hours Number of hours
     * @param {Number | null} minutes Number of minutes
     * @param {Number | null} seconds Number of seconds
     */
    #setTimespanText(
        years,
        months,
        days,
        hours,
        minutes,
        seconds
    ) {

        // If any given data is invalid, set the default text, display an error,
        // update the error type variable, and exit early
        if (years === null
            || months === null
            || days === null
            || hours === null
            || minutes === null
            || seconds === null
        ) {
            this.#deadlineTimespan.textContent
                = `Deadline Timespan:${"\u00A0".repeat(12)}-`;
            this.#deadlineError.textContent = "(!) Enter a valid deadline";
            this.#errorType = "INVALID";
            return;
        }

        // Set the deadline timespan text with the given data
        this.#deadlineTimespan.textContent = `
            Deadline Timespan:${"\u00A0".repeat(11)}
            ${years}
            ${years === 1 ? "year" : "years"},
            ${months}
            ${months === 1 ? "month" : "months"},
            ${days}
            ${days === 1 ? "day" : "days"},
            ${hours}
            ${hours === 1 ? "hour" : "hours"},
            ${minutes}
            ${minutes === 1 ? "minute" : "minutes"},
            ${seconds}
            ${seconds === 1 ? "second" : "seconds"}
        `;
    }

    /**
     * Set the date time text with the given information, and set default value
     * if any data is invalid
     * @param {Number | null} year Date time year
     * @param {MonthName | null} month Date time month name
     * @param {Number | null} day Date time day
     * @param {DayOfWeekName | null} dayOfWeek Date time day of week name
     * @param {Number | null} hour Date time hour
     * @param {Number | null} minute Date time minute
     * @param {Number | null} second Date time second
     */
    #setDateTimeText(
        year,
        month,
        day,
        dayOfWeek,
        hour,
        minute,
        second
    ) {

        // If any given data is invalid, set the default text, display an error,
        // update the error type variable, and exit early
        if (year === null
            || month === null
            || day === null
            || dayOfWeek === null
            || hour === null
            || minute === null
            || second === null
        ) {
            this.#deadlineDateTime.textContent
                = `Deadline Date and Time (UTC): -`;
            this.#deadlineError.textContent = "(!) Enter a valid deadline";
            this.#errorType = "INVALID";
            return;
        }

        // Set the deadline date time text with the given data
        this.#deadlineDateTime.textContent = `
            Deadline Date and Time (UTC):
            ${year}
            ${this.#getMonthName(this.#getMonthIndex(month))}
            ${day}
            (${dayOfWeek}),
            ${
                pad2Digits(hour)
            }:${
                pad2Digits(minute)
            }:${
                pad2Digits(second)
            }
        `;
    }

    /**
     * Gets the month name from the index of the month of the year (0 indexed)
     * @param {Number} monthIndex Index of the month of the year (0 indexed)
     * @returns {MonthName} Month name with proper noun formatting
     */
    #getMonthName(monthIndex) {
        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];
        return monthNames[monthIndex];
    }

    /**
     * Gets the month index of the year from the given month name, returns -1 if
     * no matching month name string and returns null if invalid input
     * @param {String | any} monthName Name of the month string
     * @returns {Number | null} Gets the month index of the year from, returns
     * -1 if no matching month name string and returns null if invalid input
     */
    #getMonthIndex(monthName) {
        if (typeof monthName !== "string") {
            return null;
        }
        const monthNames = [
            "january",
            "february",
            "march",
            "april",
            "may",
            "june",
            "july",
            "august",
            "september",
            "october",
            "november",
            "december"
        ];
        return monthNames.indexOf(monthName.toLowerCase());
    }

    /**
     * Gets the day name from the index of the day of the week (0 indexed)
     * @param {Number} monthIndex Index of the day of the week (0 indexed)
     * @returns {DayOfWeekName} Day of week name with proper noun formatting
     */
    #getDayName(dayIndex) {
        const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];
        return dayNames[dayIndex];
    }
}

// Define the data host section component
customElements.define("set-deadline-section", SetDeadlineSection);
