angular.module('Plethora', ['ui.router', 'chart.js'])
    .constant('NAMESPACE', 'Plethora')
    .constant('API_KEY_PLACEHOLDER', '%%APIKEY%%')
    .constant('API_FROM_PLACEHOLDER', '%%APIFROM%%')
    .constant('API_TO_PLACEHOLDER', '%%APITO%%')
    .config(PlethoraConfig)
    .service('KeychainService', KeychainService)
    .service('MarketingAPIService', MarketingAPIService)
;

function PlethoraConfig($stateProvider, $urlRouterProvider, ChartJsProvider){
    $stateProvider
        .state({name: 'marketing', url: '/marketing', component: 'marketingApi'})
        .state({name: 'key', url: '/chave', component: 'loginComponent'})
    ;

    $urlRouterProvider.otherwise('/marketing');
}

KeychainService.$inject = ['NAMESPACE'];
function KeychainService(NAMESPACE){
    this.getKey = function(){
        return localStorage.getItem(NAMESPACE + ':Keychain:Key');
    };

    this.setKey = function(key){
        localStorage.setItem(NAMESPACE + ':Keychain:Key', key);
    };
}

MarketingAPIService.$inject = ['$q', '$http', 'API_KEY_PLACEHOLDER', 'KeychainService'];
function MarketingAPIService($q, $http, API_KEY_PLACEHOLDER, KeychainService){
    const vm = this;

    this.cache = null;
    this.timestamp = null;
    this.url = 'https://api.postgrain.com/intranet/api/marketingtrololo?app_key=%%APIKEY%%';

    this.fetch = function(force = false){
        if(!KeychainService.getKey()) return $q.reject('No API key provided.');

        if(!vm.cache || force){
            vm.cache = null;
            vm.timestamp = null;

            return $http.get(vm.url.replace(API_KEY_PLACEHOLDER, KeychainService.getKey()))
                        .then(function(response){
                            vm.cache = response.data;
                            vm.timestamp = new Date();

                            return {
                                data: vm.cache,
                                timestamp: vm.timestamp
                            };
                        });
        } else{
            return $q.resolve({
                data: vm.cache,
                timestamp: vm.timestamp
            });
        }
    };
}


angular.module('Plethora').component('headerComponent', {
    template: `
        <div class="o-header__logo" ng-click="Header.goHome()">
            <svg height="30" width="30" viewBox="0 0 30 30">
                <defs><style>.cls-1{fill:#00afdd;fill-rule:evenodd;}</style></defs>
                <path class="cls-1" d="M4,0H15a4,4,0,0,1,4,4l-.1,11a4,4,0,0,1-4,4H4a4,4,0,0,1-4-4V4A4.13,4.13,0,0,1,4.15,0" transform="translate(0 0)"/>
                <path class="cls-1" d="M26.11,11H22l-.06,7a4,4,0,0,1-4.06,4H11L11,26A4,4,0,0,0,15,30H26a3.91,3.91,0,0,0,4-3.89V15A3.91,3.91,0,0,0,26.11,11Z" transform="translate(0 0)"/>
            </svg>
            <div class="o-header__logo-text">Plethora</div>
        </div>
        <div class="o-header__apis">
            <a class="o-header__apis-api" ng-repeat="api in Header.data.apis" ui-sref="{{api.state}}" ui-sref-active="active">{{api.name}}</a>
        </div>
        <div class="o-header__key" ng-click="Header.changeKey()">Chave: {{Header.data.key || 'Nenhuma'}}</div>
    `,
    controller: ['KeychainService', '$state', '$scope', function(KeychainService, $state, $scope){
        this.data = {
            key: KeychainService.getKey(),
            apis: [
                {name: 'Marketing', state: 'marketing'},
                {name: 'Cupons', state: 'app.gw'},
                {name: 'Sei lá', state: 'app.qweqwe'},
                {name: 'Outra coisa', state: 'app.asd'},
            ]
        };

        (()=>{
            if(!KeychainService.getKey()) $state.go('key');
        })();

        $scope.$on('KeychainService:key:set', (event, key)=>{
            this.data.key = key
        });

        this.goHome = function(){
            $state.go('marketing');
        };

        this.changeKey = function(){
            $state.go('key');
        }
    }],
    controllerAs: 'Header'
});

angular.module('Plethora').component('loginComponent', {
    template: `
        <div class="c-box">
            <h2>Autentique-se</h2>
            <p>Insira sua chave de acesso às APIs abaixo</p>
            <input type="text" placeholder="Chave de acesso" ng-model="$ctrl.data.key">
            <input type="submit" value="Salvar chave" ng-click="$ctrl.setKey($ctrl.data.key)">
        </div>
    `,
    controller: ['KeychainService', '$state', '$rootScope', function(KeychainService, $state, $rootScope){
        this.data = {
            key: KeychainService.getKey()
        };

        this.setKey = function(key){
            if(key){
                KeychainService.setKey(key);
                $rootScope.$broadcast('KeychainService:key:set', key);
                $state.go('marketing');
            }
        }
    }]
});

angular.module('Plethora').component('marketingApi', {
    template: `
        <div class="o-api__header">
            Última atualização às {{MarketingAPI.data.timestamp | date:'H:mm'}}. <a class="p-api-update" href="#" ng-click="MarketingAPI.update()" ">Atualizar agora</a>
        </div>
        <div class="o-api__content" ng-class="{'o-api__content--loading': !MarketingAPI.data.data}">
        
            <div class="c-stat-group row">
                <!--Contas-->
                <div class="c-stats col-md-12">
                    <div class="c-stats__header">
                        <div class="c-stats__header-title">Contas</div>
                    </div>
                    <div class="c-stats__body row">
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.contas.total | number}}</div>
                            <div class="c-stat__title">Total</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.contas.hoje | number}}</div>
                            <div class="c-stat__title">Hoje</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.contas.ontem | number}}</div>
                            <div class="c-stat__title">Ontem</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.assinantes_statics.novos_cadastros_por_dia | number:0}}</div>
                            <div class="c-stat__title">Cadastros por dia</div>
                        </div>
                    </div>
                </div>
                <!--Contas-->
                
                <!--Assinantes-->
                <div class="c-stats col-md-12">
                    <div class="c-stats__header">
                        <div class="c-stats__header-title">Assinantes</div>
                    </div>
                    <div class="c-stats__body row">
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.assinantes | number}}</div>
                            <div class="c-stat__title">Total</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.assinantes_statics.novos_por_dia | number}}</div>
                            <div class="c-stat__title">Novos por dia</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.assinantes_statics.deixam_por_dia | number}}</div>
                            <div class="c-stat__title">Saindo por dia</div>
                        </div>
                        <div class="c-stat col-md-3">
                            <div class="c-stat__value">{{MarketingAPI.data.data.pagantes | number}}</div>
                            <div class="c-stat__title">Total de pagantes</div>
                        </div>
                    </div>
                </div>
                <!--Assinantes-->
                
                <!--Campanhas-->
                <div class="c-stats col-md-12">
                    <div class="c-stats__header">
                        <div class="c-stats__header-title">Campanhas</div>
                        <div class="c-stats__header-tab" ng-click="MarketingAPI.data.campaignsTab = 'today'">Hoje</div>
                        <div class="c-stats__header-tab" ng-click="MarketingAPI.data.campaignsTab = 'yesterday'">Ontem</div>
                    </div>
                    <div class="c-stats__body row">
                        <div class="c-stat c-stat--table col-md-12" ng-show="MarketingAPI.data.campaignsTab === 'today'"> 
                            hoje
                        </div>
                        <div class="c-stat c-stat--table col-md-12" ng-show="MarketingAPI.data.campaignsTab === 'yesterday'"> 
                            ontem
                        </div>
                    </div>
                </div>
                <!--Campanhas-->
                
                <!--Outros-->
                <div class="c-stats col-md-12">
                    <div class="c-stats__header">
                        <div class="c-stats__header-title">Outros</div>
                    </div>
                    <div class="c-stats__body row">
                        <div class="c-stat col-md-4">
                            <div class="c-stat__value">{{MarketingAPI.data.data.total_instagram_accounts | number}}</div>
                            <div class="c-stat__title">Contas do Instagram</div>
                        </div>
                        <div class="c-stat col-md-4">
                            <div class="c-stat__value">{{MarketingAPI.data.data.total_channels | number}}</div>
                            <div class="c-stat__title">Total de canais</div>
                        </div>
                        <div class="c-stat col-md-4">
                            <div class="c-stat__value">{{MarketingAPI.data.data.total_social | number}}</div>
                            <div class="c-stat__title">Total social</div>
                        </div>
                    </div>
                </div>
                <!--Outros-->
            </div>
            
        </div>
    `,
    controller: ['MarketingAPIService', function(MarketingAPIService){
        const vm = this;

        this.data = {
            data: null,
            timestamp: null,
            campaignsTab: 'today'
        };

        (()=>{
            MarketingAPIService.fetch().then(function(response){
                vm.data.data = response.data;
                vm.data.timestamp = response.timestamp;
            });
        })();

        this.update = function(){
            if(vm.data.data){
                vm.data.data = null;
                vm.data.timestamp = null;

                MarketingAPIService.fetch(true).then(function(response){
                    vm.data.data = response.data;
                    vm.data.timestamp = response.timestamp;
                });
            }
        }
    }],
    controllerAs: 'MarketingAPI'
});
