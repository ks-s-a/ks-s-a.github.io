'use strict';

$(function(){
    var months = [
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

    var ModalWindow = Backbone.View.extend({

        el: $('div.modal'),

        events: {
            "click #modal-close-button, #modal-close-icon": "close",
            "click #modal-save-button": "save"
        },

        initialize: function() {

            $('body').append(
                '<div class="modal">'+
                    '<div class="modal-dialog">'+
                        '<div class="modal-content">'+
                            '<div class="modal-header">'+
                                '<button id="modal-close-icon" type="button" class="close" data-dismiss="modal">' +
                                    '<span aria-hidden="true">&times;</span>' +
                                    '<span class="sr-only">Close</span>' +
                                '</button>'+
                                '<h4 id="modal-event-header" class="modal-title">Event:</h4>'+
                            '</div>'+
                            '<div class="modal-body">'+
                                '<input id="modal-comment" type="text" class="form-control" id="comment-text">'+
                            '</div>'+
                            '<div class="modal-footer">'+
                                '<button id="modal-close-button" type="button" class="btn btn-default" data-dismiss="modal">Close</button>'+
                                '<button id="modal-save-button" type="button" class="btn btn-primary">Save changes</button>'+
                            '</div>'+
                        '</div><!-- /.modal-content -->'+
                    '</div><!-- /.modal-dialog -->'+
                '</div><!-- /.modal -->'
            );

            this.$el = $('.modal');

            Backbone.on('show:modal', this.show, this);
        },

        show: function(options) {

            // save timestamp for identify day
            this.timestamp = options.timestamp;
            var date = new Date(+this.timestamp);

            $("#modal-event-header").html('Event for ' +
                (date.toDateString().slice(8,9) === '0' ? date.toDateString().slice(9,10) : date.toDateString().slice(8,10) )+
                ' '+
                months[+date.getMonth()]+
                ' '+
                date.toDateString().slice(11,15)
            );

            $("#modal-comment").val(options.comment ? options.comment : '');

            this.$el.addClass('animated fadeInDown').show();
        },

        close: function() {
            this.$el.hide();
        },

        save: function() {
            var value = $("#modal-comment").val();

            if (value) {
                Backbone.trigger("add:comment", {"comment": value, "timestamp": this.timestamp});
                Backbone.trigger("render");
            }

            this.close();
        }
    });

    var modal = new ModalWindow;

    var EventList = Backbone.Collection.extend({

        initialize: function() {
            Backbone.on("add:comment", this.onAdd, this);
        },

        onAdd: function(options) {

            // remove previous note
            this.remove( this.filter(function(event){
                return event.attributes.timestamp === options.timestamp;
            }));

            this.add([options]);
        }
    });

    var comments = new EventList;

    var DayElement = Backbone.View.extend({

        tagName: "td",

        className: "cell",

        events: {
            "click": "onClick"
        },

        initialize: function() {
        },

        onClick: function() {
            var elem = this.$el;

            if (elem.hasClass("another-month")) {
                Backbone.trigger("change:month", +elem.attr("timestamp"));

                return false;
            }

            // if we already have event for this day - give him into modal window
            Backbone.trigger("show:modal",
                this.$el.hasClass("full-day") ?
                    comments
                        .filter(function(event){return event.attributes.timestamp === elem.attr('timestamp')})[0]
                        .attributes
                : {"timestamp": elem.attr('timestamp')}
            );
        }
    });

    var AppView = Backbone.View.extend({

        el: $(".container-calendar"),

        events: {
            "click .arrow" : "onShift"
        },

        initialize: function() {

            this.state = new Date;
            this.header = $("header");
            this.leftArrow = $(".arrowLeft");
            this.rightArrow = $(".arrowRight");

            this.render();

            Backbone.on("render", this.render, this);
            Backbone.on("change:month", this.changeMonth, this);

        },

        render: function(animateDirection) {

            var state = this.state;
            var begunDate = new Date(state.getFullYear(), state.getMonth(), 1);

            if (animateDirection !== undefined) { // if this is a shift window event
                var classArray = ["animated"];
                var classRemArray = ["animated", "fadeInRight", "fadeInLeft", "fadeOutLeft", "fadeOutRight"];

                classArray.push(animateDirection ? 'fadeInRight' : 'fadeInLeft');

                fixAnimateBug($('.calendar-table')[0], classArray, classRemArray);
            }

            // Searching first Monday
            while(begunDate.getDay() !== 1)
                begunDate.setDate(begunDate.getDate() - 1);

            // Render modal header
            this.header
                .html(months[state.getMonth()] + ' ' + state.getFullYear());
            fixAnimateBug(this.header[0], ["animated", "pulse"], ["animated", "pulse"]);

            // Render calendar table
            $("tr.calendar-table-row").each(function(i, element) {
                var elem = $(element);
                var dayElem;

                elem.empty();

                for(var j = 7;j > 0;--j) {
                    dayElem = (new DayElement()).el;

                    $(dayElem)
                        .append(begunDate.getDate())
                        .attr('timestamp', +begunDate);

                    if (begunDate.getMonth() !== state.getMonth())
                        $(dayElem).addClass("another-month");

                    if (comments.filter(function(event){return +event.attributes.timestamp === +begunDate}).length) {
                        $(dayElem).addClass("full-day");
                        if (begunDate.getMonth() === state.getMonth())
                            $(dayElem).addClass("animated flipInX");
                    }

                    begunDate.setDate(begunDate.getDate() + 1);

                    elem.append(dayElem);
                }

            });
        },

        onShift: function(event) {
            var arrow = $(event.currentTarget);

            this.changeMonth(arrow.hasClass("arrow-right")); // Determine shift direction
        },

        changeMonth: function(pos) {
            if (typeof pos === 'number')
                pos = pos > +this.state;

            this.state.setMonth( this.state.getMonth() + (pos ? 1 : -1) );

            this.render(pos);
        }
    });

    var App = new AppView;


    function fixAnimateBug(element, classArr, classRemArray) {
        element.classList.remove.apply(element.classList, classRemArray);

        $(element).attr('offsetWidth', element.offsetWidth);

        element.classList.add.apply(element.classList, classArr);

    }
});