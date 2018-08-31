angular.module('Plethora', ['ui.router'])
    .constant('NAMESPACE', 'Plethora')
    .config(PlethoraConfig)
    .service('KeychainService', KeychainService)
;

function PlethoraConfig($stateProvider, $urlRouterProvider){
    $stateProvider
        .state({name: 'app', url: '', component: 'appComponent'})
        .state({name: 'key', url: '/chave', component: 'loginComponent'})
    ;

    $urlRouterProvider.otherwise('/');
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


angular.module('Plethora').component('headerComponent', {
    template: `
        <div class="o-header__logo" ng-click="$ctrl.goHome()">
            <svg height="30" width="30" viewBox="0 0 30 30">
                <defs><style>.cls-1{fill:#00afdd;fill-rule:evenodd;}</style></defs>
                <path class="cls-1" d="M4,0H15a4,4,0,0,1,4,4l-.1,11a4,4,0,0,1-4,4H4a4,4,0,0,1-4-4V4A4.13,4.13,0,0,1,4.15,0" transform="translate(0 0)"/>
                <path class="cls-1" d="M26.11,11H22l-.06,7a4,4,0,0,1-4.06,4H11L11,26A4,4,0,0,0,15,30H26a3.91,3.91,0,0,0,4-3.89V15A3.91,3.91,0,0,0,26.11,11Z" transform="translate(0 0)"/>
            </svg>
            <div class="o-header__logo-text">Plethora</div>
        </div>
        <div class="o-header__menu">
            <div class="o-header__menu-item" ng-click="$ctrl.changeKey()">{{$ctrl.data.key ? 'Trocar chave' : 'Inserir chave'}}</div>
        </div>
        <div class="o-header__key">Chave: {{$ctrl.data.key || 'Nenhuma'}}</div>
    `,
    controller: ['KeychainService', '$state', '$scope', function(KeychainService, $state, $scope){
        this.data = {
            key: KeychainService.getKey()
        };

        $scope.$on('KeychainService:key:set', (event, key)=>{
            this.data.key = key
        });

        this.goHome = function(){
            $state.go('app');
        };

        this.changeKey = function(){
            $state.go('key');
        }
    }]
});

angular.module('Plethora').component('appComponent', {
    template: `
        <div class="o-header"></div>
        <div class="o-content"></div>
    `,
    controller: ['KeychainService', '$state', function(KeychainService, $state){
        (()=>{
            if(!KeychainService.getKey()) $state.go('key');
        })();
    }]
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
                $state.go('app');
            }
        }
    }]
});
