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
        initialize: function() {
            var self = this;

            $('body').append(
                '<div class="modal">'+
                    '<div class="modal-dialog">'+
                        '<div class="modal-content">'+
                            '<div class="modal-header">'+
                                '<button id="modal-close-icon" type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>'+
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

            this.el = $('div.modal')[0];

            Backbone.on('show:modal', this.show, this);

            $('#modal-close-button, #modal-close-icon').click(this.close.bind(this));
            $('#modal-save-button').click(this.save.bind(this));
        },

        show: function(options) {
            this.timestamp = options.timestamp;
            var dateString = (new Date(+this.timestamp)).toDateString();

            $("#modal-event-header").html('Event for ' +
                (dateString[8] == '0' ? months[+dateString[9]] : months[+dateString.slice(8,10)] ) +
                ' '+
                dateString.slice(4,7)+
                ' '+
                dateString.slice(11,15)
            );
            if (options.comment)
                $("#modal-comment").val(options.comment);

            $(this.el).addClass('animated fadeInDown').show();
        },

        close: function() {
            $(this.el).hide();

            $("#modal-comment").val('');
        },

        save: function() {
            var value = $("#modal-comment").val();

            if (!value)
                return this.close();

            Backbone.trigger("add:comment", {"comment": value, "timestamp": this.timestamp});
            Backbone.trigger("render");

            return this.close();
        }
    });

    var modal = new ModalWindow;

    var EventList = Backbone.Collection.extend({

        initialize: function() {
            Backbone.on("add:comment", this.onAdd, this);
        },

        onAdd: function(options) {
            // remove previous notes
            this.remove( this.filter(function(event){return event.attributes.timestamp === options.timestamp}));

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

            if (animateDirection !== undefined) {
                var classArray = ["animated"];

                classArray.push(animateDirection ? 'fadeInRight' : 'fadeInLeft');

                fixAnimateBug($('.calendar-table')[0], classArray);
                /*
                var element = $('.calendar-table')[0];

                element.classList.remove("animated", "fadeInRight", "fadeInLeft", "fadeOutLeft", "fadeOutRight");

                element.offsetWidth = element.offsetWidth;

                element.classList.add('animated', animateDirection ? 'fadeInRight' : 'fadeInLeft');
                */
            }
            var state = this.state;
            var begunDate = new Date(state.getFullYear(), state.getMonth(), 1);

            // Searching first Monday
            while(begunDate.getDay() !== 1)
                begunDate.setDate(begunDate.getDate() - 1);

            this.header
                .html(months[state.getMonth()] + ' ' + state.getFullYear())
                .addClass('animated pulse');


            $("tr.calendar-table-row").each(function(i, element) {
                elem = $(element);

                elem.empty();
                var day;

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

            this.changeMonth(arrow.hasClass("arrow-right"));
        },

        changeMonth: function(pos) {
            if (typeof pos === 'number')
                pos = pos > +this.state;

            this.state.setMonth( this.state.getMonth() + (pos ? 1 : -1) );

            this.render(pos);
        }
    });

    var App = new AppView;


    function fixAnimateBug(element, classArr) {
        element.classList.remove.apply(element, classArr);

        element.offsetWidth = element.offsetWidth;

        element.classList.add.apply(element, classArr);

    }
});