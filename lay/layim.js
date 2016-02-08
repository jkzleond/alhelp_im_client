/*

 @Name: layui WebIM 1.0.0
 @Author：贤心
 @Date: 2014-04-25
 @Blog: http://sentsin.com
 
 */
 
;!function(win, undefined){

    var config = {
        msgurl: '私信地址',
        chatlogurl: '聊天记录url前缀',
        aniTime: 200,
        right: -232,
        host: 'http://localhost:8850',
        cross_domain: true,
        /*api: {
            friend: 'friend.json', //好友列表接口
            group: 'group.json', //群组列表接口
            chatlog: 'chatlog.json', //聊天记录接口
            groups: 'groups.json', //群组成员接口
            sendurl: '' //发送消息接口
        },*/

        api: {
            login: {
                url: '/v1/tokens',
                method: 'POST',
                need_token: false
            },
            sync_check: {
                url: '/v1/im/sync_check',
                method: 'GET',
                need_token: true
            },
            friend: {
                url: '/v1/im/friends',
                method: 'GET',
                need_token: true
            },
            group: {
                url: '/v1/im/groups/:member_id',
                method: 'GET',
                need_token: true
            },
            //最近联系人
            rct_contacts: {
                url: '/v1/im/message/rct_contacts',
                method: 'GET',
                need_token: true
            },
            group_members: {
                url: '/v1/im/group/members',
                method: 'GET',
                need_token: true
            },
            msg: {
                url: '/v1/im/message/no_read/:type/:from_id',
                method: 'GET',
                need_token: true
            },
            mark_read: {
                url: '/v1/im/message/mark_read/:type/:from_id',
                method: 'PUT',
                need_token: true
            },
            send: {
                url: '/v1/im/message',
                method: 'POST',
                need_token: true
            }
        },

        user: { //当前用户信息
            member_id: null,
            token: 'xxxx',
            nickname: '游客',
            avatar: 'images/1.png'
        },

        //自动回复内置文案，也可动态读取数据库配置
        autoReplay: [
            '您好，我现在有事不在，一会再和您联系。',
            '你没发错吧？',
            '洗澡中，请勿打扰，偷窥请购票，个体四十，团体八折，订票电话：一般人我不告诉他！',
            '你好，我是主人的美女秘书，有什么事就跟我说吧，等他回来我会转告他的。',
            '我正在拉磨，没法招呼您，因为我们家毛驴去动物保护协会把我告了，说我剥夺它休产假的权利。',
            '<（@￣︶￣@）>',
            '你要和我说话？你真的要和我说话？你确定自己想说吗？你一定非说不可吗？那你说吧，这是自动回复。',
            '主人正在开机自检，键盘鼠标看好机会出去凉快去了，我是他的电冰箱，我打字比较慢，你慢慢说，别急……',
            '(*^__^*) 嘻嘻，是贤心吗？'
        ],


        chating: {},
        /*hosts: (function(){
            var dk = location.href.match(/\:\d+/);
            dk = dk ? dk[0] : '';
            return 'http://' + document.domain + dk + '/';
        })(),*/
        heartbeat_time: 500, //心跳间隔时间,单位 ms
        stopMP: function(e){
            e ? e.stopPropagation() : e.cancelBubble = true;
        }
    }, dom = [$(window), $(document), $('html'), $('body')], xxim = {};

    xxim.EVENT = {
        MSG_COME_IN: 'msg_come_in'
    };

    //根据url规则生成url
    xxim.url = function(api_url, data){
        var url = api_url.replace(/:(\w+)/, function(p,n){
            if(data.hasOwnProperty(n)){
                var arg = data[n];
                delete data[n];
                return arg;
            } else {
                return '';
            }
        });

        return url.replace(/\/+/, '/');
    };

    //Ajax请求
    xxim.json = function(api_config, data, callback, error){

        var url = xxim.url(api_config.url, data);

        var ajax_options = {
            url: config.host + url,
            method: api_config.method,
            crossDomain: config.cross_domain,
            dataType: 'json',
            success: callback,
            error: error
        };

        if (api_config.method != 'GET') {
            ajax_options.data = JSON.stringify(data);
            ajax_options.processData = false;
        } else {
            ajax_options.data = data;
        }

        if (api_config.need_token) {
            ajax_options.headers = {
                'X-Auth-Token': config.user.token
            }
        }

        return $.ajax(ajax_options);
    };

    //主界面tab
    xxim.tabs = function(index){
        var node = xxim.node;
        node.tabs.eq(index).addClass('xxim_tabnow').siblings().removeClass('xxim_tabnow');
        node.list.eq(index).show().siblings('.xxim_list').hide();
        if(node.list.eq(index).find('li').length === 0){
            xxim.getData(index);
        }
    };

    //节点
    xxim.renode = function(){
        var node = xxim.node = {
            tabs: $('#xxim_tabs>span'),
            list: $('.xxim_list'),
            online: $('.xxim_online'),
            setonline: $('.xxim_setonline'),
            onlinetex: $('#xxim_onlinetex'),
            xximon: $('#xxim_on'),
            layimFooter: $('#xxim_bottom'),
            xximHide: $('#xxim_hide'),
            xximSearch: $('#xxim_searchkey'),
            searchMian: $('#xxim_searchmain'),
            closeSearch: $('#xxim_closesearch'),
            layimMin: $('#layim_min')
        };
    };

    //主界面缩放
    xxim.expend = function(){
        var node = xxim.node;
        if(xxim.layimNode.attr('state') !== '1'){
            xxim.layimNode.stop().animate({right: config.right}, config.aniTime, function(){
                node.xximon.addClass('xxim_off');
                try{
                    localStorage.layimState = 1;
                }catch(e){}
                xxim.layimNode.attr({state: 1});
                node.layimFooter.addClass('xxim_expend').stop().animate({marginLeft: config.right}, config.aniTime/2);
                node.xximHide.addClass('xxim_show');
            });
        } else {
            xxim.layimNode.stop().animate({right: 1}, config.aniTime, function(){
                node.xximon.removeClass('xxim_off');
                try{
                    localStorage.layimState = 2;
                }catch(e){}
                xxim.layimNode.removeAttr('state');
                node.layimFooter.removeClass('xxim_expend');
                node.xximHide.removeClass('xxim_show');
            });
            node.layimFooter.stop().animate({marginLeft: 0}, config.aniTime);
        }
    };

    //初始化窗口格局
    xxim.layinit = function(){
        var node = xxim.node;

        //主界面
        try{
            if(!localStorage.layimState){
                config.aniTime = 0;
                localStorage.layimState = 1;
            }
            if(localStorage.layimState === '1'){
                xxim.layimNode.attr({state: 1}).css({right: config.right});
                node.xximon.addClass('xxim_off');
                node.layimFooter.addClass('xxim_expend').css({marginLeft: config.right});
                node.xximHide.addClass('xxim_show');
            }
        }catch(e){
            layer.msg(e.message, 5, -1);
        }
    };

    //聊天窗口
    xxim.popchat = function(param){
        var node = xxim.node, log = {};

        log.success = function(layero){
            layer.setMove();

            xxim.chatbox = layero.find('#layim_chatbox');
            log.chatlist = xxim.chatbox.find('.layim_chatmore>ul');

            log.chatlist.html('<li data-id="'+ param.member_id +'" type="'+ param.type +'"  id="layim_user'+ param.type + param.member_id +'"><span>'+ param.nickname +'</span><em>×</em></li>')
            xxim.tabchat(param, xxim.chatbox);

            //最小化聊天窗
            xxim.chatbox.find('.layer_setmin').on('click', function(){
                var indexs = layero.attr('times');
                layero.hide();
                node.layimMin.text(xxim.nowchat.nickname).show();
            });

            //关闭窗口
            xxim.chatbox.find('.layim_close').on('click', function(){
                var indexs = layero.attr('times');
                layer.close(indexs);
                xxim.chatbox = null;
                config.chating = {};
                config.chatings = 0;
            });

            //关闭某个聊天
            log.chatlist.on('mouseenter', 'li', function(){
                $(this).find('em').show();
            }).on('mouseleave', 'li', function(){
                $(this).find('em').hide();
            });
            log.chatlist.on('click', 'li em', function(e){
                var parents = $(this).parent(), dataType = parents.attr('type');
                var dataId = parents.attr('data-id'), index = parents.index();
                var chatlist = log.chatlist.find('li'), indexs;

                config.stopMP(e);

                delete config.chating[dataType + dataId];
                config.chatings--;

                parents.remove();
                $('#layim_area'+ dataType + dataId).remove();
                if(dataType === 'group'){
                    $('#layim_group'+ dataType + dataId).remove();
                }

                if(parents.hasClass('layim_chatnow')){
                    if(index === config.chatings){
                        indexs = index - 1;
                    } else {
                        indexs = index + 1;
                    }
                    xxim.tabchat(config.chating[chatlist.eq(indexs).attr('type') + chatlist.eq(indexs).attr('data-id')]);
                }

                if(log.chatlist.find('li').length === 1){
                    log.chatlist.parent().hide();
                }
            });

            //聊天选项卡
            log.chatlist.on('click', 'li', function(){
                var othis = $(this), dataType = othis.attr('type'), dataId = othis.attr('data-id');
                xxim.tabchat(config.chating[dataType + dataId]);
            });

            //发送热键切换
            log.sendType = $('#layim_sendtype'), log.sendTypes = log.sendType.find('span');
            $('#layim_enter').on('click', function(e){
                config.stopMP(e);
                log.sendType.show();
            });
            log.sendTypes.on('click', function(){
                log.sendTypes.find('i').text('')
                $(this).find('i').text('√');
            });

            xxim.transmit();
        };

        log.html = '<div class="layim_chatbox" id="layim_chatbox">'
                +'<h6>'
                +'<span class="layim_move"></span>'
                +'    <a href="'+ param.href +'" class="layim_face" target="_blank"><img src="'+ param.avatar +'" ></a>'
                +'    <a href="'+ param.href +'" class="layim_names" target="_blank">'+ param.nickname +'</a>'
                +'    <span class="layim_rightbtn">'
                +'        <i class="layer_setmin"></i>'
                +'        <i class="layim_close"></i>'
                +'    </span>'
                +'</h6>'
                +'<div class="layim_chatmore" id="layim_chatmore">'
                +'    <ul class="layim_chatlist"></ul>'
                +'</div>'
                +'<div class="layim_groups" id="layim_groups"></div>'
                +'<div class="layim_chat">'
                +'    <div class="layim_chatarea" id="layim_chatarea">'
                +'        <ul class="layim_chatview layim_chatthis"  id="layim_area'+ param.type + param.member_id +'"></ul>'
                +'    </div>'
                +'    <div class="layim_tool">'
                +'        <i class="layim_addface" title="发送表情"></i>'
                +'        <a href="javascript:;"><i class="layim_addimage" title="上传图片"></i></a>'
                +'        <a href="javascript:;"><i class="layim_addfile" title="上传附件"></i></a>'
                +'        <a href="" target="_blank" class="layim_seechatlog"><i></i>聊天记录</a>'
                +'    </div>'
                +'    <textarea class="layim_write" id="layim_write"></textarea>'
                +'    <div class="layim_send">'
                +'        <div class="layim_sendbtn" id="layim_sendbtn">发送<span class="layim_enter" id="layim_enter"><em class="layim_zero"></em></span></div>'
                +'        <div class="layim_sendtype" id="layim_sendtype">'
                +'            <span><i>√</i>按Enter键发送</span>'
                +'            <span><i></i>按Ctrl+Enter键发送</span>'
                +'        </div>'
                +'    </div>'
                +'</div>'
                +'</div>';

        if(config.chatings < 1){
            $.layer({
                type: 1,
                border: [0],
                title: false,
                shade: [0],
                area: ['620px', '493px'],
                move: ['.layim_chatbox .layim_move', true],
                moveType: 1,
                closeBtn: false,
                offset: [(($(window).height() - 493)/2)+'px', ''],
                page: {
                    html: log.html
                }, success: function(layero){
                    log.success(layero);
                }
            })
        } else {
            log.chatmore = xxim.chatbox.find('#layim_chatmore');
            log.chatarea = xxim.chatbox.find('#layim_chatarea');

            log.chatmore.show();

            log.chatmore.find('ul>li').removeClass('layim_chatnow');
            log.chatmore.find('ul').append('<li data-id="'+ param.member_id +'" type="'+ param.type +'" id="layim_user'+ param.type + param.member_id +'" class="layim_chatnow"><span>'+ param.nickname +'</span><em>×</em></li>');

            log.chatarea.find('.layim_chatview').removeClass('layim_chatthis');
            log.chatarea.append('<ul class="layim_chatview layim_chatthis" id="layim_area'+ param.type + param.member_id +'"></ul>');

            xxim.tabchat(param);
        }

        //群组
        log.chatgroup = xxim.chatbox.find('#layim_groups');
        if(param.type === 'group'){
            log.chatgroup.find('ul').removeClass('layim_groupthis');
            log.chatgroup.append('<ul class="layim_groupthis" id="layim_group'+ param.type + param.member_id +'"></ul>');
            xxim.getGroups(param);
        }
        //点击群员切换聊天窗
        log.chatgroup.on('click', 'ul>li', function(){
            xxim.popchatbox($(this));
        });
    };

    //定位到某个聊天队列
    xxim.tabchat = function(param){
        var node = xxim.node, log = {}, keys = param.type + param.member_id;
        xxim.nowchat = param;

        xxim.chatbox.find('#layim_user'+ keys).addClass('layim_chatnow').siblings().removeClass('layim_chatnow');
        xxim.chatbox.find('#layim_area'+ keys).addClass('layim_chatthis').siblings().removeClass('layim_chatthis');
        xxim.chatbox.find('#layim_group'+ keys).addClass('layim_groupthis').siblings().removeClass('layim_groupthis');

        xxim.chatbox.find('.layim_face>img').attr('src', param.avatar);
        xxim.chatbox.find('.layim_face, .layim_names').attr('href', param.href);
        xxim.chatbox.find('.layim_names').text(param.nickname);

        xxim.chatbox.find('.layim_seechatlog').attr('href', config.chatlogurl + param.member_id);

        log.groups = xxim.chatbox.find('.layim_groups');
        if(param.type === 'group'){
            log.groups.show();
        } else {
            log.groups.hide();
        }

        $('#layim_write').focus();

    };

    //弹出聊天窗
    xxim.popchatbox = function(othis){
        var node = xxim.node, member_id = othis.attr('data-id'), param = {
            member_id: member_id, //用户ID
            type: othis.attr('type'),
            nickname: othis.find('.xxim_onename').text(),  //用户名
            avatar: othis.find('.xxim_oneface').attr('src'),  //用户头像
            href: config.host + 'user/' + member_id //用户主页
        }, key = param.type + member_id;
        if(!config.chating[key]){
            xxim.popchat(param);
            config.chatings++;
        } else {
            xxim.tabchat(param);
        }
        config.chating[key] = param;

        var chatbox = $('#layim_chatbox');
        if(chatbox[0]){
            node.layimMin.hide();
            chatbox.parents('.xubox_layer').show();
        }
    };

    //请求群员
    xxim.getGroups = function(param){
        var keys = param.type + param.id, str = '',
        groupss = xxim.chatbox.find('#layim_group'+ keys);
        groupss.addClass('loading');
        xxim.json(config.api.group_members, {}, function(datas){
            if(datas.status === 1){
                var ii = 0, lens = datas.data.length;
                if(lens > 0){
                    for(; ii < lens; ii++){
                        str += '<li data-id="'+ datas.data[ii].id +'" type="one"><img src="'+ datas.data[ii].face +'"><span class="xxim_onename">'+ datas.data[ii].name +'</span></li>';
                    }
                } else {
                    str = '<li class="layim_errors">没有群员</li>';
                }

            } else {
                str = '<li class="layim_errors">'+ datas.msg +'</li>';
            }
            groupss.removeClass('loading');
            groupss.html(str);
        }, function(){
            groupss.removeClass('loading');
            groupss.html('<li class="layim_errors">请求异常</li>');
        });
    };

    //消息传输
    xxim.transmit = function(){
        var node = xxim.node, log = {};
        node.sendbtn = $('#layim_sendbtn');
        node.imwrite = $('#layim_write');

        //发送
        log.send = function(){
            var data = {
                content: node.imwrite.val(),
                id: xxim.nowchat.id,
                sign_key: '', //密匙
                _: +new Date
            };

            if(data.content.replace(/\s/g, '') === ''){
                layer.tips('说点啥呗！', '#layim_write', 2);
                node.imwrite.focus();
            } else {
                /*
                //此处皆为模拟
                var keys = xxim.nowchat.type + xxim.nowchat.id;

                //聊天模版
                log.html = function(param, type){
                    return '<li class="'+ (type === 'me' ? 'layim_chateme' : '') +'">'
                        +'<div class="layim_chatuser">'
                            + function(){
                                if(type === 'me'){
                                    return '<span class="layim_chattime">'+ param.time +'</span>'
                                           +'<span class="layim_chatname">'+ param.name +'</span>'
                                           +'<img src="'+ param.face +'" >';
                                } else {
                                    return '<img src="'+ param.face +'" >'
                                           +'<span class="layim_chatname">'+ param.name +'</span>'
                                           +'<span class="layim_chattime">'+ param.time +'</span>';
                                }
                            }()
                        +'</div>'
                        +'<div class="layim_chatsay">'+ param.content +'<em class="layim_zero"></em></div>'
                    +'</li>';
                };

                log.imarea = xxim.chatbox.find('#layim_area'+ keys);

                log.imarea.append(log.html({
                    time: '2014-04-26 0:37',
                    name: config.user.nickname,
                    face: config.user.avatar,
                    content: data.content
                }, 'me'));
                node.imwrite.val('').focus();
                log.imarea.scrollTop(log.imarea[0].scrollHeight);*/

                xxim.render.msg({
                    time: '2014-04-26 0:37',
                    nickname: config.user.nickname,
                    avatar: config.user.avatar,
                    content: data.content
                }, 'me');

                setTimeout(function(){
                    xxim.render.msg({
                        time: '2014-04-26 0:38',
                        nickname: xxim.nowchat.name,
                        avatar: xxim.nowchat.face,
                        content: config.autoReplay[(Math.random()*config.autoReplay.length) | 0]
                    });
                }, 500);

                /*
                that.json(config.api.sendurl, data, function(datas){

                });
                */
            }

        };
        node.sendbtn.on('click', log.send);

        node.imwrite.keyup(function(e){
            if(e.keyCode === 13){
                log.send();
            }
        });
    };

    //事件
    xxim.event = function(){
        var node = xxim.node;

        //主界面tab
        node.tabs.eq(0).addClass('xxim_tabnow');
        node.tabs.on('click', function(){
            var othis = $(this), index = othis.index();
            xxim.tabs(index);
        });

        //列表展收
        node.list.on('click', 'h5', function(){
            var othis = $(this), chat = othis.siblings('.xxim_chatlist'), parentss = othis.parent();
            if(parentss.hasClass('xxim_liston')){
                chat.hide();
                parentss.removeClass('xxim_liston');
            } else {
                chat.show();
                parentss.addClass('xxim_liston');
            }
        });

        //设置在线隐身
        node.online.on('click', function(e){
            config.stopMP(e);
            node.setonline.show();
        });
        node.setonline.find('span').on('click', function(e){
            var index = $(this).index();
            config.stopMP(e);
            if(index === 0){
                node.onlinetex.html('在线');
                node.online.removeClass('xxim_offline');
            } else if(index === 1) {
                node.onlinetex.html('隐身');
                node.online.addClass('xxim_offline');
            }
            node.setonline.hide();
        });

        node.xximon.on('click', xxim.expend);
        node.xximHide.on('click', xxim.expend);

        //搜索
        node.xximSearch.keyup(function(){
            var val = $(this).val().replace(/\s/g, '');
            if(val !== ''){
                node.searchMian.show();
                node.closeSearch.show();
                //此处的搜索ajax参考xxim.getData
                node.list.eq(3).html('<li class="xxim_errormsg">没有符合条件的结果</li>');
            } else {
                node.searchMian.hide();
                node.closeSearch.hide();
            }
        });
        node.closeSearch.on('click', function(){
            $(this).hide();
            node.searchMian.hide();
            node.xximSearch.val('').focus();
        });

        //弹出聊天窗
        config.chatings = 0;
        node.list.on('click', '.xxim_childnode', function(){
            var othis = $(this);
            xxim.popchatbox(othis);
        });

        //点击最小化栏
        node.layimMin.on('click', function(){
            $(this).hide();
            $('#layim_chatbox').parents('.xubox_layer').show();
        });


        //document事件
        dom[1].on('click', function(){
            node.setonline.hide();
            $('#layim_sendtype').hide();
        });

        //消息进入事件
        $(xxim).bind(xxim.EVENT.MSG_COME_IN, function(data){
            //TODO render msg
        });
    };

    //请求列表数据
    xxim.getData = function(index){
        var api = [
            config.api.friend, config.api.group, config.api.rct_contacts
        ];
        var api_data = [
            {}, {member_id: config.user.member_id},{}
        ];
        var node = xxim.node;
        var myf = node.list.eq(index);
        myf.addClass('loading');
        /*
        原来的数据请求与处理
        xxim.json(api[index], {'data':'data'}, function(datas){
            if(datas.status === 1){
                var i = 0, myflen = datas.data.length, str = '', item;
                if(myflen > 1){
                    if(index !== 2){
                        for(; i < myflen; i++){
                            str += '<li data-id="'+ datas.data[i].id +'" class="xxim_parentnode">'
                                +'<h5><i></i><span class="xxim_parentname">'+ datas.data[i].name +'</span><em class="xxim_nums">（'+ datas.data[i].nums +'）</em></h5>'
                                +'<ul class="xxim_chatlist">';
                            item = datas.data[i].item;
                            for(var j = 0; j < item.length; j++){
                                str += '<li data-id="'+ item[j].id +'" class="xxim_childnode" type="'+ (index === 0 ? 'one' : 'group') +'"><img src="'+ item[j].face +'" class="xxim_oneface"><span class="xxim_onename">'+ item[j].name +'</span></li>';
                            }
                            str += '</ul></li>';
                        }
                    } else {
                        str += '<li class="xxim_liston">'
                            +'<ul class="xxim_chatlist">';
                        for(; i < myflen; i++){
                            str += '<li data-id="'+ datas.data[i].id +'" class="xxim_childnode" type="one"><img src="'+ datas.data[i].face +'"  class="xxim_oneface"><span  class="xxim_onename">'+ datas.data[i].name +'</span><em class="xxim_time">'+ datas.data[i].time +'</em></li>';
                        }
                        str += '</ul></li>';
                    }
                    myf.html(str);
                } else {
                    myf.html('<li class="xxim_errormsg">没有任何数据</li>');
                }
                myf.removeClass('loading');
            } else {
                myf.html('<li class="xxim_errormsg">'+ datas.msg +'</li>');
            }
        }, function(){
            myf.html('<li class="xxim_errormsg">请求失败</li>');
            myf.removeClass('loading');
        });*/

        xxim.json(api[index], api_data[index], function(resp){
            if(resp.success === true){
                var list = resp.data.list;
                var myflen = list ? list.length : 0;
                var str = '';
                if(myflen >= 1){
                    if(index == 0){ //好友
                        str += '<li class="xxim_liston">'
                                +'<ul class="xxim_chatlist">';
                        for(var i = 0; i < myflen; i++){
                            str += '<li data-id="'+ list[i].member_id +'" class="xxim_childnode" type="single"><img src="'+ list[i].avatar +'" class="xxim_oneface"><span class="xxim_onename">'+ list[i].nickname || list[i].name +'</span></li>';
                        }
                        str += '</ul></li>';
                    } else if (index == 1) { //群
                        str += '<li class="xxim_liston">'
                            +'<ul class="xxim_chatlist">';
                        for(var i = 0; i < myflen; i++){
                            str += '<li data-id="'+ list[i].id +'" class="xxim_childnode" type="group"><img src="'+ list[i].image +'"  class="xxim_oneface"><span  class="xxim_onename">'+ list[i].name +'</span></li>';
                        }
                        str += '</ul></li>';
                    } else if (index == 2) { //最近联系人
                        str += '<li class="xxim_liston">'
                            +'<ul class="xxim_chatlist">';
                        for(var i = 0; i < myflen; i++){
                            str += '<li data-id="'+ list[i].contact_id +'" class="xxim_childnode" type="' + (list[i].is_to_group == '0' ? 'single' : 'group') + '"><img src="'+ list[i].avatar +'"  class="xxim_oneface"><span  class="xxim_onename">'+ list[i].name +'</span><em class="xxim_time">'+ '' +'</em></li>';
                        }
                        str += '</ul></li>';
                    }
                    myf.html(str);
                } else {
                    myf.html('<li class="xxim_errormsg">没有任何数据</li>');
                }
                myf.removeClass('loading');
            } else {
                myf.html('<li class="xxim_errormsg">'+ resp.msg +'</li>');
            }
        }, function(){
            myf.html('<li class="xxim_errormsg">请求失败</li>');
            myf.removeClass('loading');
        })

    };

    xxim.action = {
        /**
         * 获取当前激活聊天用户的未读消息
         */
        get_msg: function(type, from_id, success, fail){
            var data = {
                type: type,
                from_id: from_id
            };
            xxim.json(config.api.msg, data, success, fail).done(function(resp){
                if(resp.success && resp.data){
                    $(xxim).trigger(xxim.EVENT.MSG_COME_IN, resp.data);
                }
            });
        },
        /**
         * 标记当前激活聊天用户的消息为已读
         */
        mark_read: function(type, from_id, success, fail){
            var data = {
                type: type,
                from_id: from_id
            };
            xxim.json(config.api.mark_read, data, success, fail).done(function(resp){

            }).fail(function(resp){
                //请求失败后,隔500毫秒重发
                setTimeout(function(){
                    xxim.action.mark_read(type, from_id);
                }, 500);
            });
        }
    };

    //心跳
    xxim.heartbeat = function(){
        var last_time = 0;

        (function(){
            var _callee_func = arguments.callee;
            //检查新状态
            xxim.json(config.api.sync_check, {_:last_time}).done(function(resp){
                last_time = resp.data._;

                //存在新消息
                if (resp.data.has_new) {
                    //正在聊天则,获取正与之聊天用户发来的新消息
                    if (xxim.nowchat) {
                        xxim.action.get_msg(xxim.nowchat.type, xxim.nowchat.id);
                    }
                }

                setTimeout(_callee_func, 0);
            }).fail(function(resp){
                setTimeout(_callee_func, 1000);
            });
        })();
    };

    //渲染
    xxim.render = {
        //渲染消息框
        msg: function(param, type){
            var keys = xxim.nowchat.type + xxim.nowchat.member_id;

            //消息框模板
            var msg_html = '<li class="'+ (type === 'me' ? 'layim_chateme' : '') +'">'
            +'<div class="layim_chatuser">';

            if(type === 'me'){
                msg_html += '<span class="layim_chattime">'+ param.time +'</span>'
                    +'<span class="layim_chatname">'+ param.nickname +'</span>'
                    +'<img src="'+ param.face +'" >';
            } else {
                msg_html += '<img src="'+ param.face +'" >'
                    +'<span class="layim_chatname">'+ param.nickname +'</span>'
                    +'<span class="layim_chattime">'+ param.time +'</span>';
            }

            msg_html += '</div>'
                        +'<div class="layim_chatsay">'+ param.content +'<em class="layim_zero"></em></div>'
                        +'</li>';

            var msg_area = xxim.chatbox.find('#layim_area'+ keys);

            msg_area.append(msg_html);
            xxim.node.imwrite.val('').focus();
            msg_area.scrollTop(msg_area[0].scrollHeight);
        }
    };

    //渲染骨架
    xxim.view = (function(){
        var xximNode = xxim.layimNode = $('<div id="xximmm" class="xxim_main">'
                +'<div class="xxim_top" id="xxim_top">'
                +'  <div class="xxim_search"><i></i><input id="xxim_searchkey" /><span id="xxim_closesearch">×</span></div>'
                +'  <div class="xxim_tabs" id="xxim_tabs"><span class="xxim_tabfriend" title="好友"><i></i></span><span class="xxim_tabgroup" title="群组"><i></i></span><span class="xxim_latechat"  title="最近聊天"><i></i></span></div>'
                +'  <ul class="xxim_list" style="display:block"></ul>'
                +'  <ul class="xxim_list"></ul>'
                +'  <ul class="xxim_list"></ul>'
                +'  <ul class="xxim_list xxim_searchmain" id="xxim_searchmain"></ul>'
                +'</div>'
                +'<ul class="xxim_bottom" id="xxim_bottom">'
                +'<li class="xxim_online" id="xxim_online">'
                    +'<i class="xxim_nowstate"></i><span id="xxim_onlinetex">在线</span>'
                    +'<div class="xxim_setonline">'
                        +'<span><i></i>在线</span>'
                        +'<span class="xxim_setoffline"><i></i>隐身</span>'
                    +'</div>'
                +'</li>'
                +'<li class="xxim_mymsg" id="xxim_mymsg" title="我的私信"><i></i><a href="'+ config.msgurl +'" target="_blank"></a></li>'
                +'<li class="xxim_seter" id="xxim_seter" title="设置">'
                    +'<i></i>'
                    +'<div class="">'

                    +'</div>'
                +'</li>'
                +'<li class="xxim_hide" id="xxim_hide"><i></i></li>'
                +'<li id="xxim_on" class="xxim_icon xxim_on"></li>'
                +'<div class="layim_min" id="layim_min"></div>'
            +'</ul>'
        +'</div>');
        dom[3].append(xximNode);

        //处理登陆
        var href = window.location.href;
        var username = href.match(/u=([^\&]+)/)[1];
        var password = href.match(/p=([^\&]+)/)[1];

        xxim.json(config.api.login, {
            passwordCredentials: {
                username: username,
                password: password
            }
        }).done(function(resp){
            if(resp.success == true){
                config.user.member_id = resp.data.member.id;
                config.user.nickname = resp.data.member.nickname;
                config.user.avatar = resp.data.member.avatar;
                config.user.token = resp.data['X-Subject-Token'];
                xxim.renode();
                xxim.getData(0);
                xxim.event();
                xxim.layinit();
                xxim.heartbeat();
            }
        });
    }());

}(window);

