import 'package:flutter/material.dart';
import '../../services/http_client.dart';
import '../../services/vanity_service.dart';
import '../../models/account.dart';

class VanitySelectionScreen extends StatefulWidget {
  final Account fromAccount;
  const VanitySelectionScreen({super.key, required this.fromAccount});

  @override
  State<VanitySelectionScreen> createState() => _VanitySelectionScreenState();
}

class _VanitySelectionScreenState extends State<VanitySelectionScreen> {
  final _service = VanityService(ApiClient());
  String _tab = 'market';
  bool _loading = false;
  List<dynamic> _market = [];
  int _page = 1;
  String? _tier;
  String? _message;

  // Suggest
  String _pattern = '';
  int _limit = 12;
  List<String> _suggest = [];

  String? _selected;
  Map<String, dynamic>? _price;
  Map<String, dynamic>? _availability;
  String _customNumber = '';
  Map<String, dynamic>? _customPrice;
  Map<String, dynamic>? _customAvailability;

  @override
  void initState() {
    super.initState();
    _loadMarket();
  }

  Future<void> _loadMarket() async {
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      final data = await _service.market(tier: _tier, page: _page, limit: 20);
      setState(() {
        _market = data['items'] as List<dynamic>;
      });
    } catch (e) {
      setState(() {
        _message = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _loadSuggest() async {
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      final list = await _service.suggest(
        pattern: _pattern.isEmpty ? null : _pattern,
        limit: _limit,
      );
      setState(() {
        _suggest = list;
      });
    } catch (e) {
      setState(() {
        _message = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _select(String number) async {
    setState(() {
      _selected = number;
      _price = null;
      _availability = null;
    });
    try {
      final price = await _service.price(number);
      final avail = await _service.availability(number);
      setState(() {
        _price = price;
        _availability = avail;
      });
    } catch (e) {
      setState(() {
        _message = e.toString();
      });
    }
  }

  Future<void> _checkCustom() async {
    final number = _customNumber.trim();
    if (number.isEmpty) return;
    setState(() {
      _customPrice = null;
      _customAvailability = null;
      _message = null;
      _loading = true;
    });
    try {
      final price = await _service.price(number);
      final avail = await _service.availability(number);
      setState(() {
        _customPrice = price;
        _customAvailability = avail;
      });
    } catch (e) {
      setState(() {
        _message = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _purchase() async {
    if (_selected == null) return;
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      final res = await _service.purchase(
        accountId: widget.fromAccount.id,
        newAccountNumber: _selected!,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đổi số thành công: ${res['newNumber'] ?? _selected}'),
        ),
      );
      Navigator.of(context).pop(res);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Thất bại: $e')));
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Số tài khoản đẹp')),
      body: Column(
        children: [
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Align(
              alignment: Alignment.center,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: ToggleButtons(
                  isSelected: [_tab == 'market', _tab == 'suggest'],
                  onPressed: (i) {
                    setState(() {
                      _tab = i == 0 ? 'market' : 'suggest';
                    });
                    if (_tab == 'market')
                      _loadMarket();
                    else
                      _loadSuggest();
                  },
                  children: const [
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Text('Kho số'),
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Text('Gợi ý'),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (_message != null)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(_message!, style: const TextStyle(color: Colors.red)),
            ),
          Expanded(child: _tab == 'market' ? _buildMarket() : _buildSuggest()),
          const SizedBox(height: 8),
        ],
      ),
      bottomNavigationBar: _selected != null ? _buildSelectionBar() : null,
    );
  }

  Widget _buildMarket() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemBuilder: (_, i) {
        final item = _market[i] as Map<String, dynamic>;
        return ListTile(
          title: Text(item['number'] as String? ?? ''),
          subtitle: Text(
            '${item['tier']} • ${item['status']} • Giá: ${(item['basePrice'] ?? 0)}đ',
          ),
          trailing: TextButton(
            onPressed: () => _select(item['number'] as String? ?? ''),
            child: const Text('Chọn'),
          ),
        );
      },
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemCount: _market.length,
    );
  }

  Widget _buildSuggest() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Tùy chọn số tài khoản theo ý muốn
              const Text('Tự đặt số tài khoản (6-12 chữ số):'),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: const InputDecoration(
                        hintText: 'Nhập số tài khoản mong muốn',
                      ),
                      keyboardType: TextInputType.number,
                      onChanged: (v) => _customNumber = v,
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 120,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _checkCustom,
                      child: const Text('Kiểm tra'),
                    ),
                  ),
                ],
              ),
              if (_customAvailability != null || _customPrice != null) ...[
                const SizedBox(height: 6),
                Text(
                  'Tình trạng: ' +
                      (_customAvailability == null
                          ? 'Đang kiểm tra'
                          : (_customAvailability!['existsInAccounts'] == true
                                ? 'ĐÃ TỒN TẠI'
                                : (_customAvailability!['inventoryStatus'] ??
                                      'OK'))),
                  style: const TextStyle(color: Colors.black87),
                ),
                Text(
                  'Phí: ' +
                      (_customPrice == null
                          ? '—'
                          : '${_customPrice!['price']}đ (${_customPrice!['tier']})'),
                  style: const TextStyle(color: Colors.black54),
                ),
                const SizedBox(height: 6),
                Align(
                  alignment: Alignment.centerRight,
                  child: SizedBox(
                    width: 140,
                    child: ElevatedButton(
                      onPressed:
                          (_customAvailability != null &&
                              _customAvailability!['existsInAccounts'] != true)
                          ? () => _select(_customNumber)
                          : null,
                      child: const Text('Chọn số này'),
                    ),
                  ),
                ),
              ],
              const Divider(height: 24),
              TextField(
                decoration: const InputDecoration(labelText: 'Mẫu (Regex)'),
                onChanged: (v) => _pattern = v,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  SizedBox(
                    width: 120,
                    child: TextField(
                      decoration: const InputDecoration(labelText: 'Số lượng'),
                      keyboardType: TextInputType.number,
                      onChanged: (v) => _limit = int.tryParse(v) ?? 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: SizedBox(
                  width: 120,
                  child: ElevatedButton(
                    onPressed: _loadSuggest,
                    child: const Text('Gợi ý'),
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemBuilder: (_, i) {
                    final num = _suggest[i];
                    return ListTile(
                      title: Text(num),
                      trailing: TextButton(
                        onPressed: () => _select(num),
                        child: const Text('Chọn'),
                      ),
                    );
                  },
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemCount: _suggest.length,
                ),
        ),
      ],
    );
  }

  Widget _buildSelectionBar() {
    final p = _price;
    final a = _availability;
    final avail = a == null
        ? 'Đang kiểm tra...'
        : (a['existsInAccounts'] == true
              ? 'ĐÃ TỒN TẠI'
              : (a['inventoryStatus'] ?? 'OK'));
    final fee = p == null ? '—' : '${p['price']}đ (${p['tier']})';
    return SafeArea(
      child: Container(
        color: const Color(0xFFF8F9FA),
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Đang chọn: $_selected',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Phí: $fee • Tình trạng: $avail',
                    style: const TextStyle(color: Colors.black54),
                  ),
                ],
              ),
            ),
            SizedBox(
              width: 120,
              child: ElevatedButton(
                onPressed: _loading ? null : _purchase,
                child: _loading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Mua/Đổi'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
